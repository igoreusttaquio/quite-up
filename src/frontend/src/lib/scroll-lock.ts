/**
 * Rede de segurança para travas de rolagem/toque deixadas por diálogos e bottom sheets
 * (Radix/react-remove-scroll e vaul) quando são desmontados no meio de uma transição.
 * Só age se nenhum diálogo estiver aberto — com um aberto, a trava é legítima.
 */
export function releaseStuckScrollLock() {
  if (document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) return

  const body = document.body
  const html = document.documentElement

  // react-remove-scroll (Radix): atributo + estilo injetado que dá overflow:hidden ao body.
  body.removeAttribute('data-scroll-locked')

  // vaul (Safari) e outros: estilos inline no body/html.
  const wasFixed = body.style.position === 'fixed'
  const top = parseInt(body.style.top || '0', 10)
  for (const prop of ['position', 'top', 'left', 'right', 'height', 'overflow', 'pointer-events', 'touch-action']) {
    body.style.removeProperty(prop)
  }
  html.style.removeProperty('overflow')
  html.style.removeProperty('padding-right')
  // Se estava preso com position:fixed, devolve a posição de rolagem que ele escondia.
  if (wasFixed && top < 0) window.scrollTo(0, -top)
}

function isBodyLocked() {
  const body = document.body
  if (body.hasAttribute('data-scroll-locked')) return true
  const cs = getComputedStyle(body)
  return cs.overflowY === 'hidden' || cs.position === 'fixed' || cs.pointerEvents === 'none'
}

let watchdogInstalled = false

/**
 * Ao tocar/clicar na tela sem nenhum diálogo aberto, se o body estiver travado (rolagem ou
 * toques bloqueados), solta na hora — antes do gesto de rolar. Defesa contra qualquer
 * diálogo/sheet que tenha deixado a trava para trás.
 */
export function installScrollLockWatchdog() {
  if (watchdogInstalled || typeof window === 'undefined') return
  watchdogInstalled = true
  const check = () => {
    if (isBodyLocked()) releaseStuckScrollLock()
  }
  window.addEventListener('pointerdown', check, { capture: true, passive: true })
  window.addEventListener('touchstart', check, { capture: true, passive: true })
  // Voltar ao app (PWA em segundo plano) também revisa.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check()
  })
}
