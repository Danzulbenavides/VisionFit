import axios from "axios";
import FormData from "form-data";

const configuredAiServiceUrl = process.env.AI_SERVICE_URL?.trim();
const normalizedAiServiceUrl = configuredAiServiceUrl
  ? (/^https?:\/\//i.test(configuredAiServiceUrl)
      ? configuredAiServiceUrl
      : `http://${configuredAiServiceUrl}`)
  : "http://127.0.0.1:8000";
const AI_SERVICE_URL = normalizedAiServiceUrl.replace(/\/+$/, "");

export async function analyzeFaceImage(imageBuffer, filename = "face.jpg") {
  const form = new FormData();

  form.append("file", imageBuffer, {
    filename,
    contentType: "image/jpeg",
  });

  const response = await axios.post(`${AI_SERVICE_URL}/analyze-face`, form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return response.data;
}
