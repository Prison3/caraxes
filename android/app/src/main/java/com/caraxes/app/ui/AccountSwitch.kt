package com.caraxes.app.ui

import androidx.fragment.app.Fragment
import androidx.navigation.NavOptions
import androidx.navigation.fragment.findNavController
import com.caraxes.app.MainActivity
import com.caraxes.app.R
import com.caraxes.app.data.Session
import com.caraxes.app.data.UserOut

fun Fragment.enterAccount(user: UserOut) {
    Session.saveUser(requireContext(), user)
    goHomeAfterAccountChange()
}

private fun Fragment.goHomeAfterAccountChange() {
    val activity = activity as? MainActivity
    activity?.applyRoleTabs()
    activity?.refreshUsername()
    findNavController().navigate(
        Session.homeDestination(requireContext()),
        null,
        NavOptions.Builder()
            .setPopUpTo(R.id.loginFragment, false)
            .setLaunchSingleTop(true)
            .build(),
    )
}
