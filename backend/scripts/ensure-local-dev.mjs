if (process.env.RENDER) {
  console.warn(
    '[Render] Tip: set Start Command to "npm start" (not "npm run dev"). ' +
      'Remove HOST and PORT from Render environment variables if present.'
  );
}
