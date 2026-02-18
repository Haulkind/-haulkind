// Declare modules that don't have TypeScript declarations
// These are used by the server code included for tRPC type resolution
declare module 'bcryptjs';
declare module 'jsonwebtoken';
declare module 'pg' {
  const Pool: any;
  export { Pool };
  export default Pool;
}
declare module '@builder.io/vite-plugin-jsx-loc';
declare module 'server/storage';
