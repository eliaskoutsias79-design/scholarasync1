import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = { "Content-Type": "application/json" };

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

    const payload = JSON.stringify({ title, body, url, tag });
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

    return new Response(JSON.stringify({ delivered }), { headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
