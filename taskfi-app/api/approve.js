const API_BASE_URL = "https://api.minepi.com/v2/payments";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const { paymentId } = body;

    if (!paymentId) {
      return res.status(400).json({ error: "paymentId is required" });
    }

    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      const configError = new Error(
        "PI_API_KEY is not set in environment variables"
      );
      console.error(configError);
      return res.status(500).json({ error: configError.message });
    }

    const url = `${API_BASE_URL}/${encodeURIComponent(paymentId)}/approve`;

    const piResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Key 뒤에 공백이 반드시 포함되도록 명시
        Authorization: "Key " + apiKey,
      },
    });

    const responseBody = await piResponse.json().catch(() => ({}));

    if (!piResponse.ok) {
      const message =
        (responseBody && responseBody.error) ||
        (responseBody && responseBody.message) ||
        `Pi approve API error (status ${piResponse.status})`;

      const error = new Error(message);
      console.error("Pi approve API error:", piResponse.status, responseBody);
      return res.status(piResponse.status).json({ error: error.message });
    }

    return res.status(200).json(responseBody);
  } catch (error) {
    console.error("Error in /api/approve:", error);
    return res.status(500).json({ error: error.message || "Unknown error" });
  }
}