import fetch from "node-fetch";

const API_KEY = "TU_API_KEY_DE_FIREBASE";

const email = "test@test.com";
const password = "123456";

async function generateIdToken() {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;

  const body = {
    email,
    password,
    returnSecureToken: true
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (data.error) {
    console.error("Error:", data.error);
    return;
  }

  console.log("\nID Token generado:\n");
  console.log(data.idToken);
}

generateIdToken();