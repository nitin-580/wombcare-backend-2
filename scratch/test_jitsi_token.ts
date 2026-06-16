import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const jwtSecret = process.env.JWT_SECRET || 'super-secret-doctor-key-123-abc-xyz';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== Testing Jitsi Token Endpoint Configuration ===");
  const kid = process.env.JAAS_KID;
  const privateKey = process.env.JAAS_PRIVATE_KEY;
  const appId = process.env.JAAS_APP_ID;

  console.log("JaaS App ID:", appId);
  console.log("JaaS Key ID (kid):", kid);
  console.log("Private Key Loaded:", privateKey ? "Yes (length: " + privateKey.length + ")" : "No");

  if (!privateKey || !kid) {
    console.error("Missing JaaS configuration inside env files!");
    return;
  }

  // Generate a mock JWT for WombCare login
  const mockDoctor = {
    id: "fdbdcbb1-9a26-4008-a307-ac74211da6c7",
    email: "priya@wombcare.in",
    role: "teacher"
  };

  const wombcareToken = jwt.sign(mockDoctor, jwtSecret, { expiresIn: '1h' });
  console.log("\nGenerated mock WombCare teacher login token.");

  // Construct JaaS Payload
  const roomName = "test-classroom-yoga";
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: appId,
    room: roomName,
    nbf: Math.floor(Date.now() / 1000) - 10,
    exp: Math.floor(Date.now() / 1000) + 7200,
    context: {
      user: {
        name: "Dr. Priya Sharma",
        email: "priya@wombcare.in",
        id: mockDoctor.id
      },
      features: {
        moderator: true,
        recording: true,
        livestreaming: true
      }
    }
  };

  try {
    const jaasToken = jwt.sign(payload, formattedPrivateKey, {
      algorithm: 'RS256',
      keyid: kid,
      header: {
        alg: 'RS256',
        kid: kid,
        typ: 'JWT'
      }
    });

    console.log("\n✅ Secure RS256 JaaS JWT generated successfully!");
    console.log("Token:", jaasToken.substring(0, 80) + "...");
    
    // Verify locally using public key
    const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjBRLX0Xc4eOxyiUkWJDs
AN70hmz7CEdqdict3DTlvIqqQVNWf3sH3C2kDYXvPBsuYCYzG/0nxLrD5oQYNZel
IPJIBQQrCzKL3KGvNIDSvf+Fs+ecDfTpRUAKaF76TkU0xYgoOZlidtnJi7IXqb1H
IbblSF96OWdtAV72EfvydzbXGFRaq+6Q4/WcMZdKRl1awYZL1P2Udi6MezBLl7/j
IZWKsQ3KUJF7wBJiCb+leA6acA/PRblZc3jOrUC+G+e6iIZ/cPvjunsNp7EjCfMv
xVY8f+ZXiUyG4kQ5bu7jek02cDHYiMUK+UomD8MfCAG4shUz10x/oMExzk1ybwi0
vQIDAQAB
-----END PUBLIC KEY-----`;

    const verified = jwt.verify(jaasToken, publicKey, { algorithms: ['RS256'] });
    console.log("\n✅ JaaS JWT locally verified against WombCare Public Key!");
    console.log("Decoded Payload:", JSON.stringify(verified, null, 2));

  } catch (err: any) {
    console.error("\n❌ Error generating/verifying JaaS token:", err.message);
  }
}

run();
