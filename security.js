/* NORRA Security Lab — academic demo only.
   X25519 key agreement + BLAKE2b key derivation + ChaCha20-Poly1305-IETF.
   Does not encrypt checkout, account, order, or stored website data. */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const encryptBtn = $("securityEncryptBtn");
  if (!encryptBtn) return;

  let sodiumReady = false;
  let activeSession = null;

  const setStatus = (message, kind) => {
    const el = $("securityStatus");
    el.textContent = message;
    el.className = "security-status" + (kind ? " " + kind : "");
  };
  const setVerify = (message, kind) => {
    const el = $("securityVerifyStatus");
    el.textContent = message;
    el.className = "security-status" + (kind ? " " + kind : "");
  };
  const toBase64 = (bytes) => sodium.to_base64(bytes, sodium.base64_variants.ORIGINAL);
  const fromBase64 = (value) => sodium.from_base64(value, sodium.base64_variants.ORIGINAL);
  const utf8 = (value) => sodium.from_string(value);
  const decodeUtf8 = (bytes) => sodium.to_string(bytes);
  const aad = utf8("NORRA-HYBRID-DEMO-v1");

  function resetResults() {
    $("securityCiphertext").value = "";
    $("securityDecrypted").value = "";
    $("securityDecryptBtn").disabled = true;
    $("securityTamperBtn").disabled = true;
    activeSession = null;
    setVerify("No message verified yet.");
  }

  function makeEnvelope(payload) {
    return toBase64(utf8(JSON.stringify(payload)));
  }
  function parseEnvelope(value) {
    const json = decodeUtf8(fromBase64(value.trim()));
    const payload = JSON.parse(json);
    if (payload.version !== 1 || !payload.epk || !payload.nonce || !payload.ciphertext) {
      throw new Error("Invalid encrypted package format.");
    }
    return payload;
  }

  async function initialize() {
    if (!window.sodium) throw new Error("Crypto library did not load. Check your internet connection and reload.");
    await window.sodium.ready;
    sodiumReady = true;
    encryptBtn.disabled = false;
    setStatus("Cryptography library ready. Enter a message and encrypt.", "success");
  }

  encryptBtn.addEventListener("click", async () => {
    resetResults();
    if (!sodiumReady) {
      setStatus("Cryptography library is not ready. Reload the page and try again.", "error");
      return;
    }
    const message = $("securityPlaintext").value;
    if (!message.trim()) {
      setStatus("Please enter a message first.", "error");
      return;
    }
    encryptBtn.disabled = true;
    try {
      // Recipient key pair and ephemeral sender key pair are generated fresh per demo.
      const recipient = sodium.crypto_kx_keypair();
      const ephemeral = sodium.crypto_kx_keypair();

      // X25519 shared secret; both parties derive the same secret.
      const sharedSecret = sodium.crypto_scalarmult(ephemeral.privateKey, recipient.publicKey);
      const key = sodium.crypto_generichash(32, sharedSecret, null);

      const nonce = sodium.randombytes_buf(sodium.crypto_aead_chacha20poly1305_ietf_NPUBBYTES);
      const ciphertext = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
        utf8(message), aad, null, nonce, key
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
      activeSession = { recipientPrivateKey: recipient.privateKey };
      $("securityDecryptBtn").disabled = false;
      $("securityTamperBtn").disabled = false;
      setStatus("Encrypted successfully. A fresh ephemeral key and nonce were generated.", "success");
      setVerify("Ready to decrypt and verify authentication.");
      sodium.memzero(sharedSecret);
      sodium.memzero(key);
      sodium.memzero(ephemeral.privateKey);
    } catch (err) {
      console.error(err);
      setStatus("Encryption failed: " + (err.message || "unknown error"), "error");
    } finally {
      encryptBtn.disabled = false;
    }
  });

  $("securityDecryptBtn").addEventListener("click", () => {
    if (!sodiumReady || !activeSession) {
      setVerify("Encrypt a message first; the demo recipient key exists only in memory.", "error");
      return;
    }
    try {
      const payload = parseEnvelope($("securityCiphertext").value);
      const epk = fromBase64(payload.epk);
      const recipientPublicKey = fromBase64(payload.recipientPublicKey);
      const nonce = fromBase64(payload.nonce);
      const ciphertext = fromBase64(payload.ciphertext);

      // Check that the envelope belongs to the active in-memory recipient key.
      const expectedRecipientPublic = sodium.crypto_scalarmult_base(activeSession.recipientPrivateKey);
      if (!sodium.memcmp(expectedRecipientPublic, recipientPublicKey)) {
        throw new Error("This package does not match the current demo recipient key.");
      }
      const sharedSecret = sodium.crypto_scalarmult(activeSession.recipientPrivateKey, epk);
      const key = sodium.crypto_generichash(32, sharedSecret, null);
      const plaintext = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
        null, ciphertext, aad, nonce, key
      );
      $("securityDecrypted").value = decodeUtf8(plaintext);
      setVerify("Authenticated successfully — ciphertext integrity is valid.", "success");
      sodium.memzero(sharedSecret);
      sodium.memzero(key);
    } catch (err) {
      $("securityDecrypted").value = "";
      setVerify("Authentication/decryption failed. The package may be altered or invalid.", "error");
    }
  });

  $("securityTamperBtn").addEventListener("click", () => {
    try {
      const payload = parseEnvelope($("securityCiphertext").value);
      const bytes = fromBase64(payload.ciphertext);
      if (bytes.length) bytes[0] ^= 1;
      payload.ciphertext = toBase64(bytes);
      $("securityCiphertext").value = makeEnvelope(payload);
      $("securityDecrypted").value = "";
      setVerify("Ciphertext altered. Click “Decrypt & verify” to see authentication fail.", "error");
    } catch (err) {
      setVerify("Cannot tamper-test an invalid package. Encrypt a new message first.", "error");
    }
  });

  initialize().catch((err) => {
    encryptBtn.disabled = true;
    setStatus(err.message || "Could not initialize cryptography.", "error");
  });
})();
