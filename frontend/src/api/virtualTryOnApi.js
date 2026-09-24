import { fetch } from "expo/fetch";
import { File } from "expo-file-system";
import { getToken } from "../utils/storage";

const API_URL = "http://10.42.21.3:5000/api";

export const virtualTryOn = async (productId, imageUri) => {
  console.log("========================================");
  console.log("VTO API: START");
  console.log("========================================");

  if (!productId) {
    throw new Error("Product ID is required.");
  }

  if (!imageUri) {
    throw new Error("User image is required.");
  }

  console.log("VTO API: PRODUCT ID:", productId);
  console.log("VTO API: IMAGE URI:", imageUri);

  const token = await getToken();

  if (!token) {
    throw new Error("You are not authenticated.");
  }

  console.log("VTO API: TOKEN EXISTS");

  // =========================================
  // CREATE EXPO FILE REFERENCE
  // =========================================

  const imageFile = new File(imageUri);

  console.log("VTO API: FILE CREATED");
  console.log("VTO API: FILE URI:", imageFile.uri);
  console.log("VTO API: FILE EXISTS:", imageFile.exists);
  console.log("VTO API: FILE SIZE:", imageFile.size);
  console.log("VTO API: FILE TYPE:", imageFile.type);

  if (!imageFile.exists) {
    throw new Error("The selected face photo could not be found.");
  }

  // =========================================
  // CREATE MULTIPART FORM DATA
  // =========================================

  const formData = new FormData();

  console.log("VTO API: FORMDATA CREATED");

  formData.append("image", imageFile);

  console.log("VTO API: IMAGE APPENDED");

  // =========================================
  // SEND REQUEST
  // =========================================

  const url = `${API_URL}/virtual-try-on/${productId}`;

  console.log("VTO API: URL:", url);
  console.log("VTO API: SENDING REQUEST");

  const response = await fetch(url, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },

    body: formData,
  });

  console.log("VTO API: RESPONSE STATUS:", response.status);

  // =========================================
  // READ RESPONSE
  // =========================================

  let result;

  try {
    result = await response.json();
  } catch (error) {
    console.error("VTO API: JSON ERROR:", error);

    throw new Error(
      `Virtual Try-On returned an invalid response (${response.status}).`,
    );
  }

  console.log("VTO API: RESPONSE:", result);

  // =========================================
  // HANDLE SERVER ERROR
  // =========================================

  if (!response.ok) {
    throw new Error(
      result?.error?.message ||
        `Virtual Try-On failed with status ${response.status}.`,
    );
  }

  // =========================================
  // VALIDATE RESULT
  // =========================================

  if (!result?.data?.image) {
    throw new Error(
      result?.error?.message || "Virtual Try-On did not return a result image.",
    );
  }

  console.log("VTO API: SUCCESS");

  return result;
};
