import { AppState, AppStateStatus } from "react-native"

let backgroundTime: number | null = null

export function initAppLock(onLock: () => void) {

  const subscription = AppState.addEventListener(
    "change",
    (nextState: AppStateStatus) => {

      if (nextState === "background") {
        backgroundTime = Date.now()
      }

      if (nextState === "active" && backgroundTime) {

        const elapsed = Date.now() - backgroundTime

        const LOCK_TIMEOUT = 30000 // 30 seconds

        if (elapsed > LOCK_TIMEOUT) {

          console.log("Session expired → Locking app")

          onLock()
        }

        backgroundTime = null
      }
    }
  )

  return () => subscription.remove()
}