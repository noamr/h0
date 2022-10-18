export async function route(request: Request) : Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/rates"))
        throw new Error(`Unexpected URL ${request.url}`);
        
    return new Response(JSON.stringify({rates: {USD: 1, GBP: 2}, symbols: {USD: "US Dollar $", GBP: "Brittish Pound"}, from: "USD", to: "GBP"}), {headers: {"Content-Type": "application/json"}});
}
