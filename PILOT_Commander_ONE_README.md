# PILOT Commander ONE — installation simplifiée

Etat : code publié et 15 tests simulés réussis ; **pas encore installé ni exécuté sur l'iPhone réel**.

## Ce qui est déjà réel
- Scriptable déjà présent sur l'iPhone de l'utilisateur, fonctions natives testées OK.
- ChatGPT a publié un `ping` dans la branche GitHub `pilot-ping-20261105`, et l'iPhone a réellement lu deux versions successives du message.
- Le dépôt public ne contient que des commandes et des accusés de réception **techniques**, jamais de correspondance privée ou de données de rencontres.
- L'automatisation ChatGPT de vérification du vrai accusé reste active.

## Installation la plus simple (à faire une seule fois)
1. Ouvrir sur iPhone : https://github.com/kamikaze13016/FSDFGS/blob/pilot-ping-20261105/PILOT_Commander_ONE.scriptable
2. Dans GitHub, choisir **Raw / Télécharger**, puis **Partager → Scriptable** (cela dépend des possibilités de partage d'iOS). Si l'import n'apparaît pas, utiliser le fichier `.js` en le copiant dans Scriptable, ou le sauvegarder dans le dossier Scriptable de Fichiers.
3. Lancer **PILOT Commander ONE** une fois : il lit la mission `ping` depuis l'API GitHub et enregistre un état local.
4. Le retour automatique demande **une seule autorisation GitHub** : un jeton à accès limité au dépôt FSDFGS avec Contents Read and Write, conservé dans le trousseau de l'iPhone. Si le jeton n'est pas disponible, choisir **Plus tard**. Aucun mot de passe ou jeton ne doit être transmis dans ChatGPT.
5. Si un jeton est autorisé, le script écrit `pilot-results/ack-<empreinte>.json` et ne réécrit pas en boucle le même accusé.

## Limites et sécurité
- Lire des ordres depuis GitHub fonctionne seulement lorsque le script est lancé ou déclenché par Raccourcis. Aucune exécution continue silencieuse en arrière-plan n'est garantie par iOS.
- Pas de PowerShell privilégié sur iPhone standard. Scriptable est un environnement d'automatisation local dans le bac à sable d'iOS.
- Le programme n'autorise actuellement **que l'action `ping`**. Ni Instagram ni Brave ni d'autres apps ne peuvent être manipulées librement.
- Aucune mise à jour automatique de **code exécutable** depuis GitHub : seul le contenu de la commande autorisée `ping` se met à jour. Le téléchargement aveugle de code ne serait pas une mise à jour sûre.
- L'inscription, les messages et le suivi de candidates exigeraient des canaux de communication explicitement autorisés et adaptés. Aucun message privé n'est envoyé.
- L'utilisateur a demandé une solution locale et gratuite ; GitHub n'est utilisé que comme relais de données techniques, sans serveur payant.

## Validation des tests simulés
- `node --check PILOT_Commander_Install.js` : OK
- `node test-runner.cjs` : **15/15**
- Pas encore testé l'import du fichier `.scriptable` sur un véritable iPhone. Les appareils iOS et versions d'app peuvent différer.