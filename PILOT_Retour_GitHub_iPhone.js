// PILOT Commander — premier retour iPhone → GitHub (test sans données privées)
// Exécuter dans Scriptable. Ne communique JAMAIS le jeton à ChatGPT.
// Seules les missions "ping" sont acceptées : aucune action dans d'autres apps.
const OWNER = "kamikaze13016";
const REPO = "FSDFGS"; // Dépôt de test PUBLIC : aucun contenu personnel.
const BRANCH = "pilot-ping-20261105";
const KEY = "PILOT_FSDFGS_WRITE_TOKEN_V1";
const ROOT = `https://api.github.com/repos/${OWNER}/${REPO}/contents/`;
const HEADERS = {
  "Accept": "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "Cache-Control": "no-cache"
};

async function getFile(path, token) {
  const url = ROOT + path + "?ref=" + encodeURIComponent(BRANCH) + "&t=" + Date.now();
  const r = new Request(url);
  r.timeoutInterval = 20;
  r.headers = token ? { ...HEADERS, Authorization: "Bearer " + token } : HEADERS;
  const body = await r.loadJSON();
  return { code: r.response.statusCode, body };
}

async function getToken() {
  if (Keychain.contains(KEY)) return Keychain.get(KEY);
  const a = new Alert();
  a.title = "PILOT — Autorisation GitHub";
  a.message = "Colle ici uniquement le jeton à accès limité au dépôt FSDFGS. Il restera dans le trousseau chiffré de l'iPhone.";
  a.addSecureTextField("Jeton GitHub", "");
  a.addAction("Enregistrer localement");
  a.addCancelAction("Annuler");
  if (await a.presentAlert() !== 0) throw new Error("Configuration annulée");
  const token = a.textFieldValue(0).trim();
  if (!token.startsWith("github_pat_") || token.length < 20) {
    throw new Error("Utilise un jeton GitHub à permissions fines (github_pat_...) ; rien n'a été sauvegardé");
  }
  Keychain.set(KEY, token);
  return token;
}

let rapport = "";
try {
  const cmd = await getFile("ping.json", null);
  if (cmd.code !== 200 || cmd.body.encoding !== "base64") {
    throw new Error("Lecture GitHub impossible : HTTP " + cmd.code);
  }
  if (!/^[a-f0-9]{40}$/.test(cmd.body.sha)) throw new Error("SHA GitHub invalide");
  const data = Data.fromBase64String(cmd.body.content.replace(/\s/g, ""));
  if (!data) throw new Error("Contenu GitHub illisible");
  const mission = JSON.parse(data.toRawString());
  if (mission.action !== "ping" ||
      mission.id !== "pilot-real-20261105-01" ||
      typeof mission.message !== "string" || mission.message.length > 300) {
    throw new Error("Mission non autorisée : seules les commandes ping prévues sont acceptées");
  }

  const token = await getToken();
  // Identifiant déterministe : relancer le même test n'écrit pas de doublon.
  const path = "pilot-results/ack-" + cmd.body.sha.slice(0, 16) + ".json";
  const existing = await getFile(path, token);
  if (existing.code === 200) {
    rapport = "PILOT RETOUR GITHUB : DEJA ENVOYE\nFichier : " + path;
  } else if (existing.code === 404) {
    const payload = {
      protocol: "PILOT_ACK_V1",
      mission_id: mission.id,
      command_sha: cmd.body.sha,
      status: "received_on_iphone",
      // Ne jamais ajouter coordonnées, messages privés, identifiants ou jetons.
      note: "Test technique sans données personnelles"
    };
    const r = new Request(ROOT + path);
    r.timeoutInterval = 20;
    r.method = "PUT";
    r.headers = {
      ...HEADERS,
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    };
    r.body = JSON.stringify({
      message: "PILOT: accusé de réception de la mission de test",
      branch: BRANCH,
      content: Data.fromString(JSON.stringify(payload, null, 2) + "\n").toBase64String()
    });
    const result = await r.loadJSON();
    if (r.response.statusCode !== 201 && r.response.statusCode !== 200) {
      if (r.response.statusCode === 401) Keychain.remove(KEY);
      throw new Error("Publication refusée : HTTP " + r.response.statusCode);
    }
    if (!result || !result.content || !result.content.sha) {
      throw new Error("Réponse GitHub incomplète : vérifier avant de relancer");
    }
    rapport = "PILOT RETOUR GITHUB : OK\nFichier : " + path +
      "\nMission : " + mission.id;
  } else {
    if (existing.code === 401) Keychain.remove(KEY);
    throw new Error("Impossible de vérifier un éventuel doublon : HTTP " + existing.code);
  }
} catch (e) {
  // Pas de copie de l'objet d'erreur réseau brut, susceptible de contenir un secret.
  const m = String(e.message || e);
  rapport = "PILOT RETOUR GITHUB : ERREUR\n" + m.slice(0, 200);
}
Pasteboard.copyString(rapport);
const a = new Alert();
a.title = "PILOT — Retour de commande";
a.message = rapport + "\n\nCopié dans le presse-papiers.";
a.addAction("OK");
await a.presentAlert();
Script.complete();
