package com.caraxes.app.ui

import android.content.Context
import androidx.fragment.app.Fragment
import androidx.navigation.NavController
import androidx.navigation.NavOptions
import androidx.navigation.fragment.findNavController
import com.caraxes.app.MainActivity
import com.caraxes.app.data.Session
import com.caraxes.app.data.UserOut

fun Fragment.enterAccount(user: UserOut) {
    Session.saveUser(requireContext(), user)
    goHomeAfterAccountChange()
}

fun NavController.resetTo(destId: Int) {
    navigate(
        destId,
        null,
        NavOptions.Builder()
            .setPopUpTo(graph.id, true)
            .setLaunchSingleTop(true)
            .build(),
    )
}

fun NavController.navigateToHome(context: Context) {
    resetTo(Session.homeDestination(context))
}

private fun Fragment.goHomeAfterAccountChange() {
    val activity = activity as? MainActivity
    activity?.applyRoleTabs()
    activity?.refreshUsername()
    findNavController().navigateToHome(requireContext())
}
