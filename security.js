
/* NORRA Security Lab
   X25519 + BLAKE2b + ChaCha20-Poly1305
   Academic demonstration only.
*/
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const encryptBtn = $("securityEncryptBtn");
  const decryptBtn = $("securityDecryptBtn");
  const tamperBtn = $("securityTamperBtn");

  // Exit if this page does not contain the Security Lab.
  if (!encryptBtn || !decryptBtn || !tamperBtn) return;

  let sodium = null;
  let sodiumReady = false;
  let aad = null;
  let activeSession = null;

  function setStatus(message, kind = "") {
    const el = $("securityStatus");
    if (!el) return;
    el.textContent = message;
    el.className = "security-status" + (kind ? " " + kind : "");
  }

  function setVerify(message, kind = "") {
    const el = $("securityVerifyStatus");
    if (!el) return;
    el.textContent = message;
    el.className = "security-status" + (kind ? " " + kind : "");
  }

  function toBase64(bytes) {
    return sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL);
  }

  function fromBase64(value) {
    return sodium.from_base64(
      value,
      sodium.base64_variants.ORIGINAL
    );
  }

  function utf8(value) {
    return sodium.from_string(value);
  }

  function decodeUtf8(bytes) {
    return sodium.to_string(bytes);
  }

  function resetResults() {
    $("securityCiphertext").value = "";
    $("securityDecrypted").value = "";
    decryptBtn.disabled = true;
    tamperBtn.disabled = true;
    activeSession = null;
    setVerify("No message verified yet.");
  }

  function makeEnvelope(payload) {
    return toBase64(utf8(JSON.stringify(payload)));
  }

  function parseEnvelope(value) {
    const json = decodeUtf8(fromBase64(value.trim()));
    const payload = JSON.parse(json);

    if (
      payload.version !== 1 ||
      !payload.epk ||
      !payload.recipientPublicKey ||
      !payload.nonce ||
      !payload.ciphertext
    ) {
      throw new Error("Invalid encrypted package format.");
    }

    return payload;
  }

async function initialize() {
  try {
    setStatus("Loading cryptography library...", "");

    const module = await import(
      "https://cdn.jsdelivr.net/npm/libsodium-wrappers@0.7.15/+esm"
    );

    sodium = module.default || module;
    await sodium.ready;

    aad = sodium.from_string("NORRA-HYBRID-DEMO-v1");

    sodiumReady = true;
    encryptBtn.disabled = false;

    setStatus(
      "Cryptography library ready. Enter a message and encrypt.",
      "success"
    );
  } catch (error) {
    console.error("NORRA Security Lab initialization error:", error);
    encryptBtn.disabled = true;

    setStatus(
      "Crypto library failed to load. Check the browser Console.",
      "error"
    );
  }
}

  
  encryptBtn.disabled = true;
  decryptBtn.disabled = true;
  tamperBtn.disabled = true;

  encryptBtn.addEventListener("click", async () => {
    resetResults();

    if (!sodiumReady) {
      setStatus("Cryptography library is not ready. Please reload.", "error");
      return;
    }

    const message = $("securityPlaintext").value;

    if (!message.trim()) {
      setStatus("Please enter a message first.", "error");
      return;
    }

    encryptBtn.disabled = true;

    let sharedSecret;
    let key;
    let ephemeral;

    try {
      // Create a fresh demo recipient and ephemeral sender key pair.
      const recipient = sodium.crypto_box_keypair();
      ephemeral = sodium.crypto_box_keypair();

      // X25519 shared secret.
      sharedSecret = sodium.crypto_scalarmult(
        ephemeral.privateKey,
        recipient.publicKey
      );

      // Derive a 32-byte encryption key using BLAKE2b.
      key = sodium.crypto_generichash(32, sharedSecret);

      // Unique random nonce for this encryption.
      const nonce = sodium.randombytes_buf(
        sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES
      );

      const ciphertext =
        sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
          utf8(message),
          aad,
          null,
          nonce,
          key
        );

      const payload = {
        version: 1,
        algorithm: "X25519+BLAKE2b+ChaCha20-Poly1305-IETF",
        epk: toBase64(ephemeral.publicKey),
        recipientPublicKey: toBase64(recipient.publicKey),
        nonce: toBase64(nonce),
        ciphertext: toBase64(ciphertext)
      };

      $("securityCiphertext").value = makeEnvelope(payload);

      // Private key stays in memory for this demo session only.
      activeSession = {
        recipientPrivateKey: recipient.privateKey
      };

      decryptBtn.disabled = false;
      tamperBtn.disabled = false;

      setStatus(
        "Encrypted successfully. A fresh key pair and nonce were generated.",
        "success"
      );

      setVerify("Ready to decrypt and verify authentication.");
    } catch (error) {
      console.error("Encryption error:", error);
      setStatus(
        "Encryption failed: " + (error.message || "Unknown error"),
        "error"
      );
    } finally {
      if (sharedSecret) sodium.memzero(sharedSecret);
      if (key) sodium.memzero(key);
      if (ephemeral) sodium.memzero(ephemeral.privateKey);
      encryptBtn.disabled = false;
    }
  });

  decryptBtn.addEventListener("click", () => {
    if (!sodiumReady || !activeSession) {
      setVerify(
        "Encrypt a message first. The demo private key exists only in memory.",
        "error"
      );
      return;
    }

    let sharedSecret;
    let key;

    try {
      const payload = parseEnvelope($("securityCiphertext").value);

      const ephemeralPublicKey = fromBase64(payload.epk);
      const recipientPublicKey = fromBase64(
        payload.recipientPublicKey
      );
      const nonce = fromBase64(payload.nonce);
      const ciphertext = fromBase64(payload.ciphertext);

      const expectedPublicKey = sodium.crypto_scalarmult_base(
        activeSession.recipientPrivateKey
      );

      if (!sodium.memcmp(expectedPublicKey, recipientPublicKey)) {
        throw new Error("Package does not match this demo session.");
      }

      sharedSecret = sodium.crypto_scalarmult(
        activeSession.recipientPrivateKey,
        ephemeralPublicKey
      );

      key = sodium.crypto_generichash(32, sharedSecret);

      // Decryption verifies the Poly1305 authentication tag too.
      const plaintext =
        sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
          null,
          ciphertext,
          aad,
          nonce,
          key
        );

      $("securityDecrypted").value = decodeUtf8(plaintext);

      setVerify(
        "Authenticated successfully — ciphertext integrity is valid.",
        "success"
      );
    } catch (error) {
      console.error("Decryption/verification failed:", error);
      $("securityDecrypted").value = "";

      setVerify(
        "Authentication failed. The package may be altered, invalid, or from another session.",
        "error"
      );
    } finally {
      if (sharedSecret) sodium.memzero(sharedSecret);
      if (key) sodium.memzero(key);
    }
  });

  tamperBtn.addEventListener("click", () => {
    if (!sodiumReady || !activeSession) {
      setVerify("Encrypt a message first.", "error");
      return;
    }

    try {
      const payload = parseEnvelope($("securityCiphertext").value);
      const bytes = fromBase64(payload.ciphertext);

      if (bytes.length === 0) {
        throw new Error("Empty ciphertext.");
      }

      // Flip one bit to demonstrate tamper detection.
      bytes[0] ^= 1;

      payload.ciphertext = toBase64(bytes);
      $("securityCiphertext").value = makeEnvelope(payload);
      $("securityDecrypted").value = "";

      setVerify(
        "Ciphertext altered. Click Decrypt & Verify to test authentication.",
        "error"
      );
    } catch (error) {
      setVerify(
        "Tamper test failed. Encrypt a new message first.",
        "error"
      );
    }
  });

  initialize();
})();
