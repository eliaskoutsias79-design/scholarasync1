const CLASS_ALIASES = {
  JA1: "Junior High A1", JA2: "Junior High A2", JA3: "Junior High A3", JA4: "Junior High A4", JA5: "Junior High A5",
  JB1: "Junior High B1", JB2: "Junior High B2", JB3: "Junior High B3", JB4: "Junior High B4", JB5: "Junior High B5",
  JC1: "Junior High C1", JC2: "Junior High C2", JC3: "Junior High C3", JC4: "Junior High C4", JC5: "Junior High C5",
  HA1: "High School A1", HA2: "High School A2", HA3: "High School A3", HA4: "High School A4", HA5: "High School A5",
  HB1: "High School B1", HB2: "High School B2", HB3: "High School B3", HB4: "High School B4", HB5: "High School B5",
  HC1: "High School C1", HC2: "High School C2", HC3: "High School C3", HC4: "High School C4", HC5: "High School C5",
};

export const formatClassName = (input) => {
  if (!input) return "";
  return CLASS_ALIASES[input.toUpperCase().trim()] || input.trim();
};

export const parseCommaList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
