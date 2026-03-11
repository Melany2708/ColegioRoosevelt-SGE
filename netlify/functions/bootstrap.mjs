import { countUsers, getAuthenticatedUser } from "./shared/auth.mjs";
import { listAuditLogs } from "./shared/audit.mjs";
import { getSnapshot } from "./shared/snapshot.mjs";
import { jsonResponse, methodNotAllowed } from "./shared/http.mjs";

export default async function handler(request) {
  if (request.method !== "GET") {
    return methodNotAllowed("GET");
  }

  try {
    const userCount = await countUsers();
    const auth = await getAuthenticatedUser(request);
    if (!auth) {
      return jsonResponse({
        ok: true,
        backend: true,
        authenticated: false,
        setupRequired: userCount === 0
      });
    }

    const snapshot = await getSnapshot();
    const logs = await listAuditLogs(100);

    return jsonResponse({
      ok: true,
      backend: true,
      authenticated: true,
      setupRequired: userCount === 0,
      session: auth.session,
      user: auth.user,
      state: snapshot.state,
      logs,
      snapshotSource: snapshot.source,
      snapshotUpdatedAt: snapshot.updatedAt
    }, 200, {
      "set-cookie": auth.refreshCookie
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message,
      hint: "Si esta es la primera vez, ejecuta primero el esquema SQL y el script de usuarios."
    }, 500);
  }
}
