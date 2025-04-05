const bsv = require('bsv');

/**
 * BSVSignature class for handling Bitcoin SV signatures and verification
 * Based on the existing SmartLedger code
 */
class BSVSignature {
  /**
   * Verify a signature against a message and public key
   * @param {string} message - The message that was signed
   * @param {string} signature - The signature to verify
   * @param {string} publicKey - The public key to verify against
   * @returns {boolean} - True if signature is valid
   */
  static verify(message, signature, publicKey) {
    try {
      const messageHash = bsv.crypto.Hash.sha256(Buffer.from(message));
      const sig = bsv.crypto.Signature.fromString(signature);
      const pubKey = bsv.PublicKey.fromString(publicKey);
      
      return bsv.crypto.ECDSA.verify(messageHash, sig, pubKey);
    } catch (error) {
      console.error('Signature verification error:', error.message);
      return false;
    }
  }
  
  /**
   * Sign a message with a private key
   * @param {string} message - The message to sign
   * @param {string} privateKey - The private key to sign with
   * @returns {string} - The signature
   */
  static sign(message, privateKey) {
    try {
      const messageHash = bsv.crypto.Hash.sha256(Buffer.from(message));
      const privKey = bsv.PrivateKey.fromString(privateKey);
      const signature = bsv.crypto.ECDSA.sign(messageHash, privKey);
      
      return signature.toString();
    } catch (error) {
      console.error('Signing error:', error.message);
      throw new Error('Failed to sign message');
    }
  }
  
  /**
   * Generate a new key pair
   * @returns {Object} - { privateKey, publicKey }
   */
  static generateKeyPair() {
    const privateKey = bsv.PrivateKey.fromRandom();
    const publicKey = privateKey.toPublicKey();
    
    return {
      privateKey: privateKey.toString(),
      publicKey: publicKey.toString()
    };
  }
}

module.exports = BSVSignature;