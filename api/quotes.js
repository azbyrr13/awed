import handler from "../lib/server-api.js";

export default function endpoint(req, res) {
  return handler(req, res);
}