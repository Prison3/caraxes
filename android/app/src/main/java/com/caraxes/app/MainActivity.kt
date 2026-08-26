package com.caraxes.app

import android.os.Bundle
import android.view.View
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.NavHostFragment
import com.caraxes.app.data.ApiClient
import com.caraxes.app.data.Session
import com.caraxes.app.databinding.ActivityMainBinding
import com.caraxes.app.ui.navigateToHome
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
            if (destination.id == R.id.loginFragment && Session.isLoggedIn(this)) {
                binding.root.post {
                    if (navController.currentDestination?.id == R.id.loginFragment &&
                        Session.isLoggedIn(this)
                    ) {
                        navController.navigateToHome(this)
                        refreshRole()
                    }
                }
                return@addOnDestinationChangedListener
            }
            if (!Session.isAllowedDestination(this, destination.id) && destination.id != R.id.loginFragment) {
                navController.navigateToHome(this)
                return@addOnDestinationChangedListener
            }
            val isLogin = destination.id == R.id.loginFragment
            val isEdit = destination.id == R.id.staffEditFragment
            binding.bottomNav.visibility = if (isLogin || isEdit) View.GONE else View.VISIBLE
            binding.topBar.visibility = if (isLogin || isEdit) View.GONE else View.VISIBLE
            if (!isLogin) refreshUsername()
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val destId = navController.currentDestination?.id
                if (destId == R.id.staffEditFragment) {
                    navController.navigateUp()
                    return
                }
                if (Session.isLoggedIn(this@MainActivity) && destId != R.id.loginFragment) {
                    val home = Session.homeDestination(this@MainActivity)
                    if (destId != home && navController.popBackStack(home, false)) {
                        return
                    }
                    finish()
                    return
                }
                if (!navController.popBackStack()) {
                    finish()
                }
            }
        })
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
