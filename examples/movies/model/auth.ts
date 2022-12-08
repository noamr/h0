import { tmdb, tmdb_post } from "./api";

export async function logout(request: Request) {
  return new Response("", {status: 302, headers: {
    "Location": request.headers.get("referer") || "/",
    "Set-Cookie": `tmdb_session_id=`
  }})
}

export async function login(request: Request) {
  const url = new URL(request.url);
  const {request_token, success, expires_at} = await tmdb<{request_token: string, success: boolean, expires_at: string}>("/authentication/token/new");
  if (!success) {
    return new Response(JSON.stringify({message: "Could not initiate request"}), {headers: {
      "Content-Type": "application/json"
    }, status: 403});
  }
  const next = url.searchParams.get("next") || new URL("/", url);
  const auth = new URL(`/auth`, next);
  auth.searchParams.set("next", next.toString());
  auth.searchParams.set("expires_at", expires_at);
  const tmdb_auth = new URL(`https://www.themoviedb.org/authenticate/${request_token}`);
  tmdb_auth.searchParams.set("redirect_to", auth.toString());
  console.log(tmdb_auth.toString());
  return Response.redirect(tmdb_auth.toString());
 }

 export async function respondToAuth(request: Request) {
  const url = new URL(request.url);
  const request_token = url.searchParams.get("request_token");
  const approved = !!url.searchParams.get("approved");
  const expires_at = url.searchParams.get("expires_at");
  const next = url.searchParams.get("next") || new URL("/", request.url);
  if (!approved)
    return Response.redirect(next);

  const {session_id, success} = await tmdb_post<{success: true, session_id: string}>("/authentication/session/new", {}, {request_token});

  if (!success)
    return Response.redirect(next);

  return new Response("", {status: 302, headers: {
    "Location": next.toString(),
    "Set-Cookie": `tmdb_session_id=${session_id}; Expires=${expires_at}`}});
 }