export function isPublicTippspielEnabled() {
  return process.env.TIPPSPIEL_ENABLED === "true";
}

export function isPublicEventConfiguratorEnabled() {
  return process.env.EVENT_CONFIGURATOR_ENABLED === "true";
}
