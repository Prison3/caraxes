package com.caraxes.app.ui.me

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.NavOptions
import androidx.navigation.fragment.findNavController
import com.caraxes.app.BuildConfig
import com.caraxes.app.MainActivity
import com.caraxes.app.R
import com.caraxes.app.data.ApiClient
import com.caraxes.app.data.AppReleaseInfo
import com.caraxes.app.data.PasswordChangeIn
import com.caraxes.app.data.Session
import com.caraxes.app.databinding.DialogPasswordBinding
import com.caraxes.app.databinding.FragmentMeBinding
import com.caraxes.app.ui.fail
import com.caraxes.app.update.AppUpdater
import kotlin.math.roundToInt
import kotlinx.coroutines.launch

class MeFragment : Fragment() {
    private var _binding: FragmentMeBinding? = null
    private val binding get() = _binding!!
    private var releaseInfo: AppReleaseInfo? = null
    private var checking = false

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentMeBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        refreshProfile()
        binding.currentVersionText.text = "当前版本  v${BuildConfig.VERSION_NAME}"
        binding.changePasswordBtn.setOnClickListener { showPasswordDialog() }
        binding.checkUpdateBtn.setOnClickListener { checkUpdate() }
        binding.installUpdateBtn.setOnClickListener {
            val info = releaseInfo ?: return@setOnClickListener
            (requireActivity() as MainActivity).appUpdate.promptUpdate(info)
        }
        binding.logoutBtn.setOnClickListener { confirmLogout() }
        checkUpdate(silent = true)
    }

    override fun onResume() {
        super.onResume()
        if (_binding != null) refreshProfile()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun refreshProfile() {
        val name = Session.username(requireContext()).ifBlank { "用户" }
        binding.usernameText.text = name
        binding.avatarLetter.text = name.first().toString()
        val role = if (Session.isAdmin(requireContext())) "管理员" else "店长"
        val shop = Session.shopName(requireContext())
        binding.roleText.text = if (Session.isAdmin(requireContext())) {
            "龙厨当家 · $role"
        } else {
            "龙厨当家 · $role${if (shop.isNotBlank()) " · $shop" else ""}"
        }
        binding.accountHint.text = "当前账号：$name（$role）。可修改登录密码。"
    }

    private fun checkUpdate(silent: Boolean = false) {
        if (checking) return
        checking = true
        if (!silent) binding.latestVersionText.text = "最新版本  检查中…"
        binding.checkUpdateBtn.isEnabled = false
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val raw = ApiClient.get(requireContext()).appInfo()
                val info = raw.copy(
                    download_url = AppUpdater.resolveDownloadUrl(
                        Session.baseUrl(requireContext()),
                        raw.download_url,
                    ),
                )
                releaseInfo = info
                val sizeMb = (info.size_bytes / 1048576.0).roundToInt()
                binding.latestVersionText.text = "最新版本  v${info.version_name}（约 ${sizeMb} MB）"
                val hasUpdate = info.version_code > BuildConfig.VERSION_CODE
                binding.installUpdateBtn.isVisible = hasUpdate
                binding.updateStatusText.text = if (hasUpdate) "发现新版本，建议更新。" else "当前已是最新版本。"
                binding.updateStatusText.setTextColor(
                    requireContext().getColor(if (hasUpdate) R.color.cinnabar else R.color.pine),
                )
                if (!silent && !hasUpdate) {
                    Toast.makeText(requireContext(), "当前已是最新版本", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                val msg = fail(e)
                releaseInfo = null
                binding.installUpdateBtn.isVisible = false
                binding.latestVersionText.text = "最新版本  $msg"
                binding.updateStatusText.text = ""
                if (!silent) Toast.makeText(requireContext(), msg, Toast.LENGTH_LONG).show()
            } finally {
                checking = false
                _binding?.checkUpdateBtn?.isEnabled = true
            }
        }
    }

    private fun showPasswordDialog() {
        val content = DialogPasswordBinding.inflate(layoutInflater)
        val dialog = AlertDialog.Builder(requireContext())
            .setTitle("修改登录密码")
            .setView(content.root)
            .setPositiveButton("保存", null)
            .setNegativeButton("取消", null)
            .create()
        dialog.setOnShowListener {
            val saveBtn = dialog.getButton(AlertDialog.BUTTON_POSITIVE)
            saveBtn.setOnClickListener {
                val oldPwd = content.oldPassword.text?.toString().orEmpty()
                val newPwd = content.newPassword.text?.toString().orEmpty()
                val confirmPwd = content.confirmPassword.text?.toString().orEmpty()
                when {
                    oldPwd.isEmpty() -> {
                        toast("请输入当前密码")
                        return@setOnClickListener
                    }
                    newPwd.length < 4 -> {
                        toast("新密码至少 4 位")
                        return@setOnClickListener
                    }
                    newPwd != confirmPwd -> {
                        toast("两次输入的新密码不一致")
                        return@setOnClickListener
                    }
                    newPwd == oldPwd -> {
                        toast("新密码不能与当前密码相同")
                        return@setOnClickListener
                    }
                }
                saveBtn.isEnabled = false
                viewLifecycleOwner.lifecycleScope.launch {
                    try {
                        ApiClient.get(requireContext()).changePassword(
                            PasswordChangeIn(oldPwd, newPwd),
                        )
                        toast("密码已修改，下次请用新密码登录")
                        dialog.dismiss()
                    } catch (e: Exception) {
                        toast(fail(e))
                        saveBtn.isEnabled = true
                    }
                }
            }
        }
        dialog.show()
    }

    private fun confirmLogout() {
        val name = Session.username(requireContext()).ifBlank { "当前账号" }
        AlertDialog.Builder(requireContext())
            .setTitle("退出登录")
            .setMessage("确定退出账号 $name ？")
            .setPositiveButton("退出") { _, _ ->
                viewLifecycleOwner.lifecycleScope.launch {
                    runCatching { ApiClient.get(requireContext()).logout() }
                    Session.clear(requireContext())
                    val options = NavOptions.Builder()
                        .setPopUpTo(findNavController().graph.id, true)
                        .setLaunchSingleTop(true)
                        .build()
                    findNavController().navigate(R.id.loginFragment, null, options)
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun toast(msg: String) {
        Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
    }
}
