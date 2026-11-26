export function paraFormatoDaApi(documento) {
  const { _id, ...campos } = documento;
  return { id: _id.toHexString(), ...campos };
}
