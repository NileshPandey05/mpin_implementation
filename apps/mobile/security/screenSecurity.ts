import * as ScreenCapture from "expo-screen-capture"

export async function enableScreenProtection() {

  await ScreenCapture.preventScreenCaptureAsync()

}

export async function disableScreenProtection() {

  await ScreenCapture.allowScreenCaptureAsync()

}

ScreenCapture.addScreenshotListener(() => {
  console.log("Screenshot detected")
})