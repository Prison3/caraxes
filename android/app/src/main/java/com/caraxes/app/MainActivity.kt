package com.caraxes.app

import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.NavHostFragment
import com.caraxes.app.data.ApiClient
import com.caraxes.app.data.Session
import com.caraxes.app.databinding.ActivityMainBinding
import com.caraxes.app.update.AppUpdateHelper
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding
    lateinit var appUpdate: AppUpdateHelper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)
        appUpdate = AppUpdateHelper(this)
        appUpdate.checkOnLaunch()

        val navHost = supportFragmentManager.findFragmentById(R.id.nav_host) as NavHostFragment
        val navController = navHost.navController
        binding.bottomNav.setupWithNavController(navController)
        applyRoleTabs()

        navController.addOnDestinationChangedListener { _, destination, _ ->
            if (!Session.isAllowedDestination(this, destination.id) && destination.id != R.id.loginFragment) {
                navController.navigate(Session.homeDestination(this))
                return@addOnDestinationChangedListener
            }
            val isLogin = destination.id == R.id.loginFragment
            binding.bottomNav.visibility = if (isLogin) View.GONE else View.VISIBLE
            binding.topBar.visibility = if (isLogin) View.GONE else View.VISIBLE
            if (!isLogin) refreshUsername()
        }

        if (Session.isLoggedIn(this) && navController.currentDestination?.id == R.id.loginFragment) {
            navController.navigate(Session.homeDestination(this))
            refreshRole()
        }
    }

    fun applyRoleTabs() {
        binding.bottomNav.setAllowedDestinations(Session.allowedNavIds(this))
    }

    fun refreshRole() {
        if (!Session.isLoggedIn(this)) return
        lifecycleScope.launch {
            try {
                val me = ApiClient.get(this@MainActivity).me()
                Session.saveUser(this@MainActivity, me)
                applyRoleTabs()
                binding.userChip.text = me.username
            } catch (_: Exception) {
            }
        }
    }

    fun refreshUsername() {
        val cached = Session.username(this)
        if (cached.isNotBlank()) {
            binding.userChip.text = cached
            return
        }
        binding.userChip.text = "…"
        refreshRole()
    }

    override fun onDestroy() {
        if (::appUpdate.isInitialized) appUpdate.dismiss()
        super.onDestroy()
    }
}
