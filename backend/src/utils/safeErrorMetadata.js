module.exports = function safeErrorMetadata(error) {
  const type =
    typeof error?.name === "string" &&
    /^[A-Za-z][A-Za-z0-9_.]{0,79}$/.test(error.name)
      ? error.name
      : "Error";
  const code =
    typeof error?.code === "string" &&
    /^(P\d{4}|[A-Z][A-Z0-9_]{1,49})$/.test(error.code)
      ? error.code
      : "INTERNAL_ERROR";
  return { type, code };
};
