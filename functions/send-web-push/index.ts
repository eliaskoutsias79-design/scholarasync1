import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { importPKCS8, SignJWT } from "npm:jose@5.9.6";

const corsHeaders = { "Content-Type": "application/json" };

let cachedGoogleToken: { value: string; expiresAt: number } | null = null;

async function getGoogleAccessToken() {
  if (cachedGoogleToken && cachedGoogleToken.expiresAt > Date.now() + 60_000) {
    return cachedGoogleToken.value;
  }

  const serviceAccount = JSON.parse(
    Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON") || ""
  );
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(serviceAccount.private_key, "RS256");
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(serviceAccount.client_email)
    .setSubject(serviceAccount.client_email)
    .setAudience(serviceAccount.token_uri)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const response = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google OAuth failed: ${await response.text()}`);

  const data = await response.json();
  cachedGoogleToken = {
    value: data.access_token,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
  return cachedGoogleToken.value;
}

async function sendFcm(
  token: string,
  payload: { title: string; body: string; url: string; tag: string }
) {
  const serviceAccount = JSON.parse(
    Deno.env.get("FIREBASE_SERVICE_ACCOUNT_JSON") || ""
  );
  const accessToken = await getGoogleAccessToken();
  return fetch(
    `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          data: {
            title: payload.title,
            body: payload.body,
            url: payload.url,
            tag: payload.tag,
          },
          android: { priority: "high" },
        },
      }),
    }
  );
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (
    !Deno.env.get("WEBHOOK_SECRET") ||
    request.headers.get("x-webhook-secret") !== Deno.env.get("WEBHOOK_SECRET")
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { table, record } = await request.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const recipients = new Set<string>();
    let title = "ScholarAsync";
    let body = "You have a new update.";
    let url = "/";
    let tag = `${table}-${record.id}`;

    if (table === "messages") {
      title = record.is_class_chat ? "New class message" : "New direct message";
      body = record.content || "Open ScholarAsync to read it.";
      url = "/?view=messages";
      if (record.receiver_id) recipients.add(record.receiver_id);
      if (record.is_class_chat && record.class_name) {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_class", record.class_name)
          .neq("id", record.sender_id);
        data?.forEach(({ id }) => recipients.add(id));
      }
    } else if (table === "announcements") {
      title = record.title || "New announcement";
      body = record.content || "A new announcement was posted.";
      url = "/?view=announcements";
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_class", record.class_name)
        .neq("id", record.teacher_id);
      data?.forEach(({ id }) => recipients.add(id));
    } else if (table === "grades") {
      title = `New grade${record.subject ? ` · ${record.subject}` : ""}`;
      body = `Your result: ${record.grade_value}`;
      url = "/?view=grades";
      recipients.add(record.student_id);
    } else if (table === "study_group_messages") {
      title = "New Study Group message";
      body = record.content || "A group has new activity.";
      url = "/?view=study-groups";
      const { data } = await supabase
        .from("study_group_members")
        .select("user_id")
        .eq("group_id", record.group_id)
        .neq("user_id", record.sender_id);
      data?.forEach(({ user_id }) => recipients.add(user_id));
    } else if (table === "study_group_invites") {
      title = "Study Group invitation";
      body = "You were invited to join a Study Group.";
      url = "/?view=study-groups";
      recipients.add(record.invited_user_id);
    } else {
      return new Response(JSON.stringify({ ignored: true }), {
        headers: corsHeaders,
      });
    }

    if (recipients.size === 0) {
      return new Response(JSON.stringify({ delivered: 0 }), {
        headers: corsHeaders,
      });
    }

    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", [...recipients]);
    if (error) throw error;

    webpush.setVapidDetails(
      "mailto:info@scholarasync.app",
      Deno.env.get("VAPID_PUBLIC_KEY")!,
      Deno.env.get("VAPID_PRIVATE_KEY")!
    );

    const notificationPayload = { title, body, url, tag };
    const payload = JSON.stringify(notificationPayload);
    let delivered = 0;

    await Promise.all(
      (subscriptions || []).map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload
          );
          delivered += 1;
        } catch (pushError: any) {
          if (pushError.statusCode === 404 || pushError.statusCode === 410) {
            await supabase
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id);
            return;
          }
          console.error("Push delivery failed", pushError);
        }
      })
    );

    const { data: androidTokens, error: androidTokenError } = await supabase
      .from("android_push_tokens")
      .select("id, token")
      .in("user_id", [...recipients]);
    if (androidTokenError) throw androidTokenError;

    await Promise.all(
      (androidTokens || []).map(async ({ id, token }) => {
        try {
          const response = await sendFcm(token, notificationPayload);
          if (response.ok) {
            delivered += 1;
            return;
          }

          const failure = await response.text();
          if (
            response.status === 404 ||
            failure.includes("UNREGISTERED") ||
            failure.includes("INVALID_ARGUMENT")
          ) {
            await supabase.from("android_push_tokens").delete().eq("id", id);
            return;
          }
          console.error("FCM delivery failed", response.status, failure);
        } catch (fcmError) {
          console.error("FCM delivery failed", fcmError);
        }
      })
    );

    return new Response(JSON.stringify({ delivered }), { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
