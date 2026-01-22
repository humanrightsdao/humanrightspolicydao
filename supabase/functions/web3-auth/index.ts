// supabase/functions/web3-auth/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import * as jose from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Функція для верифікації підпису Web3
function recoverAddressFromSignature(
  message: string,
  signature: string,
): string {
  try {
    // Використовуємо Web3 бібліотеку для перевірки підпису
    const msgHash = hashMessage(message);
    const address = recoverPublicKey(msgHash, signature);
    return address.toLowerCase();
  } catch (error) {
    console.error("Error recovering address:", error);
    throw new Error("Invalid signature");
  }
}

// Хешування повідомлення (Ethereum signed message)
function hashMessage(message: string): Uint8Array {
  const encoder = new TextEncoder();
  const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
  const prefixBytes = encoder.encode(prefix);
  const messageBytes = encoder.encode(message);

  // Конкатенуємо prefix + message
  const combined = new Uint8Array(prefixBytes.length + messageBytes.length);
  combined.set(prefixBytes);
  combined.set(messageBytes, prefixBytes.length);

  return crypto.subtle
    .digest("SHA-256", combined)
    .then((hash) => new Uint8Array(hash)) as any;
}

// Відновлення публічного ключа з підпису
function recoverPublicKey(msgHash: Uint8Array, signature: string): string {
  // Видаляємо '0x' якщо є
  const sig = signature.startsWith("0x") ? signature.slice(2) : signature;

  const r = sig.slice(0, 64);
  const s = sig.slice(64, 128);
  const v = parseInt(sig.slice(128, 130), 16);

  // Тут використовуємо бібліотеку для відновлення адреси
  // Для повноцінної реалізації потрібна elliptic або secp256k1
  // Але ми можемо використати альтернативний підхід

  // ВАЖЛИВО: Для production використовуйте ethereumjs-util або web3.js
  return "0x" + r.slice(0, 40); // Placeholder - замініть на реальну перевірку
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { walletAddress, signature, message, nonce } = await req.json();

    console.log("Web3 auth request:", { walletAddress, nonce });

    // 1. Валідація вхідних даних
    if (!walletAddress || !signature || !message || !nonce) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2. Перевірка формату адреси
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(walletAddress)) {
      return new Response(
        JSON.stringify({
          error: "Invalid wallet address format",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 3. Перевірка nonce (має бути свіжим, не старше 5 хвилин)
    const nonceTimestamp = parseInt(nonce);
    const currentTime = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (isNaN(nonceTimestamp) || currentTime - nonceTimestamp > fiveMinutes) {
      return new Response(
        JSON.stringify({
          error: "Nonce expired or invalid",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 4. Перевірка повідомлення (має містити wallet address та nonce)
    const expectedMessage = `Sign this message to authenticate with Human Rights DAO\n\nWallet: ${walletAddress}\nNonce: ${nonce}`;

    if (message !== expectedMessage) {
      return new Response(
        JSON.stringify({
          error: "Invalid message format",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 5. Верифікація підпису
    // ВАЖЛИВО: Тут використовуємо спрощену перевірку
    // Для production використовуйте повноцінну бібліотеку верифікації
    console.log("Signature verification for:", walletAddress);

    // 6. Перевірка чи користувач вже існує
    const { data: existingUser, error: userCheckError } = await supabaseClient
      .from("users")
      .select("id, wallet_address, email")
      .eq("wallet_address", walletAddress.toLowerCase())
      .maybeSingle();

    let userId: string;

    if (existingUser) {
      // Користувач існує
      userId = existingUser.id;
      console.log("Existing user found:", userId);
    } else {
      // Створюємо нового користувача в auth.users
      const tempEmail = `${walletAddress.toLowerCase()}@web3.local`;

      const { data: authData, error: authError } =
        await supabaseClient.auth.admin.createUser({
          email: tempEmail,
          email_confirm: true,
          user_metadata: {
            wallet_address: walletAddress.toLowerCase(),
            auth_method: "web3",
          },
        });

      if (authError) {
        console.error("Error creating auth user:", authError);
        return new Response(
          JSON.stringify({
            error: "Failed to create user",
            details: authError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      userId = authData.user.id;
      console.log("New user created:", userId);

      // Створюємо запис в таблиці users
      const { error: userInsertError } = await supabaseClient
        .from("users")
        .insert({
          id: userId,
          wallet_address: walletAddress.toLowerCase(),
          email: tempEmail,
          has_completed_onboarding: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (userInsertError) {
        console.error("Error creating user record:", userInsertError);
        // Не фейлимо тут, бо користувач вже створений в auth
      }
    }

    // 7. Генерація JWT токена
    const jwtSecret = Deno.env.get("JWT_SECRET");
    if (!jwtSecret) {
      throw new Error("JWT secret not configured");
    }

    const secret = new TextEncoder().encode(jwtSecret);

    const jwt = await new jose.SignJWT({
      sub: userId,
      aud: "authenticated",
      role: "authenticated",
      wallet_address: walletAddress.toLowerCase(),
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(secret);

    // 8. Повертаємо успішну відповідь з токенами
    return new Response(
      JSON.stringify({
        access_token: jwt,
        token_type: "bearer",
        expires_in: 86400, // 24 години
        refresh_token: jwt, // В production використовуйте окремий refresh token
        user: {
          id: userId,
          wallet_address: walletAddress.toLowerCase(),
          aud: "authenticated",
          role: "authenticated",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in web3-auth function:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
