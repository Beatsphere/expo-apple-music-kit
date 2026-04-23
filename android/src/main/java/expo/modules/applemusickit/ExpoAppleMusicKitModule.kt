package expo.modules.applemusickit

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import com.apple.android.sdk.authentication.AuthenticationFactory
import com.apple.android.sdk.authentication.AuthenticationManager
import com.apple.android.sdk.authentication.TokenError
import com.apple.android.sdk.authentication.TokenResult
import expo.modules.kotlin.Promise
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.Serializable
import androidx.activity.result.ActivityResultCallback

private const val APPLE_MUSIC_PACKAGE = "com.apple.android.music"

private data class AuthInput(val developerToken: String) : Serializable

private class AuthContract(
  private val getAuthManager: () -> AuthenticationManager
) : AppContextActivityResultContract<AuthInput, TokenResult> {
  override fun createIntent(context: Context, input: AuthInput): Intent {
    return getAuthManager().createIntentBuilder(input.developerToken).build()
  }

  override fun parseResult(input: AuthInput, resultCode: Int, intent: Intent?): TokenResult {
    if (intent == null) {
      return TokenResult(TokenError.UNKNOWN)
    }
    return getAuthManager().handleTokenResult(intent)
  }
}

class ExpoAppleMusicKitModule : Module() {
  private var authLauncher: AppContextActivityResultLauncher<AuthInput, TokenResult>? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoAppleMusicKit")

    RegisterActivityContracts {
      authLauncher = registerForActivityResult(AuthContract(::authManager))
    }

    AsyncFunction("isAvailable") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      return@AsyncFunction isAppleMusicInstalled(context)
    }

    AsyncFunction("isAppleMusicAppInstalled") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      return@AsyncFunction isAppleMusicInstalled(context)
    }

    AsyncFunction("requestAuthorization") { developerToken: String, promise: Promise ->
      startAuth(developerToken, promise, returnTokenOnly = false)
    }

    AsyncFunction("getUserToken") { developerToken: String, promise: Promise ->
      startAuth(developerToken, promise, returnTokenOnly = true)
    }

    AsyncFunction("getAuthorizationStatus") {
      // The Android SDK doesn't expose persistent auth status; return notDetermined.
      return@AsyncFunction "notDetermined"
    }

    AsyncFunction("signOut") {
      // No persisted session to clear on Android.
      return@AsyncFunction null
    }
  }

  private fun authManager(): AuthenticationManager {
    val context = appContext.reactContext
      ?: throw IllegalStateException("React context not available")
    return AuthenticationFactory.createAuthenticationManager(context)
  }

  private fun startAuth(developerToken: String, promise: Promise, returnTokenOnly: Boolean) {
    val context = appContext.reactContext
    if (context == null) {
      promise.reject("E_NO_CONTEXT", "React context not available", null)
      return
    }

    if (!isAppleMusicInstalled(context)) {
      promise.resolve(
        mapOf(
          "authorized" to false,
          "error" to "Apple Music app is not installed"
        )
      )
      return
    }

    val launcher = authLauncher
    if (launcher == null) {
      promise.reject("E_NO_LAUNCHER", "Activity launcher not available", null)
      return
    }

    launcher.launch(AuthInput(developerToken), ActivityResultCallback { result ->
      if (result.isError()) {
        val error = result.getError()?.name ?: "UNKNOWN"
        if (returnTokenOnly) {
          promise.reject("E_AUTH_FAILED", error, null)
        } else {
          promise.resolve(
            mapOf(
              "authorized" to false,
              "error" to error
            )
          )
        }
        return@ActivityResultCallback
      }

      val token = result.getMusicUserToken()
      if (returnTokenOnly) {
        promise.resolve(token)
      } else {
        promise.resolve(
          mapOf(
            "authorized" to true,
            "userToken" to token
          )
        )
      }
    })
  }

  private fun isAppleMusicInstalled(context: Context): Boolean {
    return try {
      if (Build.VERSION.SDK_INT >= 33) {
        context.packageManager.getPackageInfo(
          APPLE_MUSIC_PACKAGE,
          PackageManager.PackageInfoFlags.of(0)
        )
      } else {
        @Suppress("DEPRECATION")
        context.packageManager.getPackageInfo(APPLE_MUSIC_PACKAGE, 0)
      }
      true
    } catch (e: PackageManager.NameNotFoundException) {
      false
    }
  }
}
