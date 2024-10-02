// src/SigV4Utils.js
import crypto from "crypto-js";

class SigV4Utils {
  static getSignedUrl(host, region, accessKey, secretKey, sessionToken) {
    const time = SigV4Utils.getAmzDate(new Date());
    const date = time.substr(0, 8);

    const service = "iotdevicegateway";
    const algorithm = "AWS4-HMAC-SHA256";
    const method = "GET";
    const canonicalUri = "/mqtt";
    const credentialScope = `${date}/${region}/${service}/aws4_request`;
    const canonicalQuerystring = `X-Amz-Algorithm=${algorithm}&X-Amz-Credential=${encodeURIComponent(
      `${accessKey}/${credentialScope}`
    )}&X-Amz-Date=${time}&X-Amz-SignedHeaders=host`;

    const canonicalHeaders = `host:${host}\n`;
    const payloadHash = crypto.SHA256("").toString(crypto.enc.Hex);
    const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuerystring}\n${canonicalHeaders}\nhost\n${payloadHash}`;
    const stringToSign = `${algorithm}\n${time}\n${credentialScope}\n${crypto
      .SHA256(canonicalRequest)
      .toString(crypto.enc.Hex)}`;

    const signingKey = SigV4Utils.getSignatureKey(
      secretKey,
      date,
      region,
      service
    );
    const signature = crypto
      .HmacSHA256(stringToSign, signingKey)
      .toString(crypto.enc.Hex);

    let finalQuerystring = `${canonicalQuerystring}&X-Amz-Signature=${signature}`;
    if (sessionToken) {
      finalQuerystring += `&X-Amz-Security-Token=${encodeURIComponent(
        sessionToken
      )}`;
    }

    return `wss://${host}${canonicalUri}?${finalQuerystring}`;
  }

  static getSignatureKey(key, dateStamp, regionName, serviceName) {
    const kDate = crypto.HmacSHA256(dateStamp, "AWS4" + key);
    const kRegion = crypto.HmacSHA256(regionName, kDate);
    const kService = crypto.HmacSHA256(serviceName, kRegion);
    const kSigning = crypto.HmacSHA256("aws4_request", kService);
    return kSigning;
  }

  static getAmzDate(date) {
    return date.toISOString().replace(/[:\-]|\.\d{3}/g, "");
  }
}

export default SigV4Utils;
