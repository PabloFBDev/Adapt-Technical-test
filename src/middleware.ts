export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/tickets/new",
    "/tickets/:path*/edit",
    "/api/ai/:path*",
  ],
};
