package com.haulkinddrivernative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.firebase.FirebaseApp
import com.google.firebase.FirebaseOptions
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import org.json.JSONArray
import org.json.JSONObject

object DriverAlertStore {
  private const val STORE = "haulkind_order_alerts"
  private const val NOTIFICATION_ID = 724106

  private fun preferences(context: Context) = context.getSharedPreferences(STORE, Context.MODE_PRIVATE)
  private fun manager(context: Context) = context.getSystemService(NotificationManager::class.java)
  private fun sound(context: Context) = Uri.parse("android.resource://${context.packageName}/raw/notification_sound")

  fun seenEvents(context: Context): String {
    val driverId = preferences(context).getString("driverId", "")
    return preferences(context).getString("seen:$driverId", "[]") ?: "[]"
  }

  fun initializeFirebase(context: Context) {
    val config = preferences(context).getString("firebase", null) ?: return
    if (FirebaseApp.getApps(context).isNotEmpty()) return
    val data = JSONObject(config)
    FirebaseApp.initializeApp(context, FirebaseOptions.Builder()
      .setApplicationId(data.getString("appId"))
      .setApiKey(data.getString("apiKey"))
      .setProjectId(data.getString("projectId"))
      .setGcmSenderId(data.getString("senderId"))
      .build())
  }

  fun configureFirebase(context: Context, config: String) {
    preferences(context).edit().putString("firebase", config).apply()
    initializeFirebase(context)
  }

  @Synchronized
  fun configure(context: Context, config: JSONObject) {
    preferences(context).edit()
      .putString("driverId", config.optString("driverId"))
      .putBoolean("online", config.optBoolean("online"))
      .putBoolean("enabled", config.optBoolean("notifications", true))
      .putBoolean("sound", config.optBoolean("sound", true))
      .putBoolean("vibration", config.optBoolean("vibration", true))
      .apply()
    channel(context)
    if (!config.optBoolean("online") || !config.optBoolean("notifications", true)) {
      manager(context).cancel(NOTIFICATION_ID)
    }
  }

  private fun channel(context: Context): String {
    val prefs = preferences(context)
    val hasSound = prefs.getBoolean("sound", true)
    val vibrates = prefs.getBoolean("vibration", true)
    val id = "haulkind_orders_v5_${hasSound}_${vibrates}"
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(id, "Order alerts", NotificationManager.IMPORTANCE_HIGH)
      channel.description = "New orders while you are online"
      channel.lockscreenVisibility = Notification.VISIBILITY_PRIVATE
      channel.setSound(if (hasSound) sound(context) else null, AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_NOTIFICATION)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
      channel.enableVibration(vibrates)
      if (vibrates) channel.vibrationPattern = longArrayOf(0, 400, 150, 400)
      manager(context).createNotificationChannel(channel)
    }
    return id
  }

  fun status(context: Context): JSONObject {
    val id = channel(context)
    val channel = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) manager(context).getNotificationChannel(id) else null
    val audio = context.getSystemService(AudioManager::class.java)
    return JSONObject()
      .put("channelId", id)
      .put("permissionGranted", manager(context).areNotificationsEnabled() && channel?.importance != NotificationManager.IMPORTANCE_NONE)
      .put("systemMuted", audio.getStreamVolume(AudioManager.STREAM_NOTIFICATION) == 0 ||
        manager(context).currentInterruptionFilter != NotificationManager.INTERRUPTION_FILTER_ALL ||
        (preferences(context).getBoolean("sound", true) && channel != null && channel.sound == null))
  }

  @Synchronized
  fun show(context: Context, alert: JSONObject, preview: Boolean = false): Boolean {
    val prefs = preferences(context)
    val driverId = prefs.getString("driverId", "") ?: ""
    if (!prefs.getBoolean("enabled", true) || driverId.isEmpty() ||
      alert.optString("driverId") != driverId ||
      (!preview && !prefs.getBoolean("online", false))) return false
    val id = channel(context)
    if (!status(context).getBoolean("permissionGranted")) return false
    val incoming = alert.optJSONArray("eventIds") ?: return false
    val events = (0 until incoming.length()).map { incoming.getString(it) }
    val saved = JSONArray(prefs.getString("seen:$driverId", "[]"))
    val seen = (0 until saved.length()).map { saved.getString(it) }
    if (events.isEmpty() || events.all { seen.contains(it) }) return false
    val orderId = alert.optString("orderId")
    val intent = Intent(context, MainActivity::class.java)
      .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      .putExtra("haulkind_order_id", orderId)
      .putExtra("haulkind_driver_id", driverId)
    val action = PendingIntent.getActivity(context, NOTIFICATION_ID, intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Notification.Builder(context, id)
      else Notification.Builder(context)
    builder.setSmallIcon(R.drawable.ic_notification)
      .setContentTitle(alert.getString("title"))
      .setContentText(alert.getString("body"))
      .setStyle(Notification.BigTextStyle().bigText(alert.getString("body")))
      .setContentIntent(action)
      .setCategory(Notification.CATEGORY_EVENT)
      .setVisibility(Notification.VISIBILITY_PRIVATE)
      .setAutoCancel(true)
      .setOnlyAlertOnce(false)
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      builder.setPriority(Notification.PRIORITY_HIGH)
      if (prefs.getBoolean("sound", true)) builder.setSound(sound(context))
      if (prefs.getBoolean("vibration", true)) builder.setVibrate(longArrayOf(0, 400, 150, 400))
    }
    manager(context).notify(NOTIFICATION_ID, builder.build())
    prefs.edit().putString("seen:$driverId", JSONArray((seen + events).distinct().takeLast(1000)).toString()).apply()
    return true
  }
}

class DriverMessagingService : FirebaseMessagingService() {
  override fun onMessageReceived(message: RemoteMessage) {
    val alert = message.data["alert"] ?: return
    try {
      DriverAlertStore.show(this, JSONObject(alert))
    } catch (_: Exception) {
      android.util.Log.w("DriverAlerts", "Could not display order notification")
    }
  }
}

class DriverNotificationsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  init {
    context.addActivityEventListener(object : BaseActivityEventListener() {
      override fun onNewIntent(intent: Intent) {
        if (intent.hasExtra("haulkind_order_id")) {
          context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("haulkindNotificationPress", null)
        }
      }
    })
  }

  override fun getName() = "DriverNotifications"

  @ReactMethod
  fun configure(config: String, promise: Promise) {
    try {
      DriverAlertStore.configure(context, JSONObject(config))
      promise.resolve(DriverAlertStore.status(context).toString())
    } catch (error: Exception) {
      promise.reject("ALERT_SETUP", "Could not configure order alerts", error)
    }
  }

  @ReactMethod
  fun getToken(config: String, promise: Promise) {
    try {
      DriverAlertStore.configureFirebase(context, config)
      FirebaseMessaging.getInstance().token
        .addOnSuccessListener { promise.resolve(it) }
        .addOnFailureListener { promise.reject("PUSH_TOKEN", "Could not register background alerts", it) }
    } catch (error: Exception) {
      promise.reject("PUSH_SETUP", "Could not configure background alerts", error)
    }
  }

  @ReactMethod
  fun showAlert(alert: String, preview: Boolean, promise: Promise) {
    try {
      promise.resolve(DriverAlertStore.show(context, JSONObject(alert), preview))
    } catch (error: Exception) {
      promise.reject("ALERT_DISPLAY", "Could not display order alert", error)
    }
  }

  @ReactMethod
  fun seenEvents(promise: Promise) {
    promise.resolve(DriverAlertStore.seenEvents(context))
  }

  @ReactMethod
  fun consumeOrder(promise: Promise) {
    val intent = context.currentActivity?.intent
    val orderId = intent?.getStringExtra("haulkind_order_id")
    val driverId = intent?.getStringExtra("haulkind_driver_id")
    intent?.removeExtra("haulkind_order_id")
    intent?.removeExtra("haulkind_driver_id")
    promise.resolve(if (orderId.isNullOrBlank()) null else JSONObject().put("orderId", orderId).put("driverId", driverId).toString())
  }
}

class DriverNotificationsPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(DriverNotificationsModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
