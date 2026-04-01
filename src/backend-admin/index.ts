export const demo = {
    GET: (req: Request) => {
        return new Response(JSON.stringify({ id: req.params.id }));
    }
}