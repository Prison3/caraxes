package com.caraxes.app.ui.login

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.caraxes.app.MainActivity
import com.caraxes.app.data.ApiClient
import com.caraxes.app.data.LoginIn
import com.caraxes.app.data.Session
import com.caraxes.app.data.apiErrorMessage
import com.caraxes.app.databinding.FragmentLoginBinding
import com.caraxes.app.ui.navigateToHome
import kotlinx.coroutines.launch
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

class LoginFragment : Fragment() {
    private var _binding: FragmentLoginBinding? = null
    private val binding get() = _binding!!
    private var advancedOpen = false

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentLoginBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        binding.serverUrl.setText(Session.displayBaseUrl(requireContext()))
        binding.advancedPanel.isVisible = false
        binding.advancedBtn.text = "服务器设置 ▸"

        binding.advancedBtn.setOnClickListener {
            advancedOpen = !advancedOpen
            binding.advancedPanel.isVisible = advancedOpen
            binding.advancedBtn.text = if (advancedOpen) "服务器设置 ▾" else "服务器设置 ▸"
            if (advancedOpen) {
                binding.serverUrl.setText(Session.displayBaseUrl(requireContext()))
            }
        }

        binding.saveServerBtn.setOnClickListener {
            val url = binding.serverUrl.text?.toString().orEmpty()
            Session.saveBaseUrl(requireContext(), url)
            Toast.makeText(
                requireContext(),
                "已保存：${Session.displayBaseUrl(requireContext())}",
                Toast.LENGTH_SHORT,
            ).show()
            advancedOpen = false
            binding.advancedPanel.isVisible = false
            binding.advancedBtn.text = "服务器设置 ▸"
        }

        binding.loginBtn.setOnClickListener {
            if (advancedOpen) {
                Session.saveBaseUrl(
                    requireContext(),
                    binding.serverUrl.text?.toString().orEmpty(),
                )
            }
            val username = binding.username.text?.toString()?.trim().orEmpty()
            val password = binding.password.text?.toString().orEmpty()
            if (username.isEmpty() || password.isEmpty()) {
                binding.errorText.text = "请输入用户名和密码"
                return@setOnClickListener
            }
            binding.errorText.text = ""
            binding.loginBtn.isEnabled = false
            viewLifecycleOwner.lifecycleScope.launch {
                try {
                    val user = ApiClient.get(requireContext()).login(LoginIn(username, password))
                    Session.saveUser(requireContext(), user)
                    (activity as? MainActivity)?.applyRoleTabs()
                    (activity as? MainActivity)?.refreshUsername()
                    findNavController().navigateToHome(requireContext())
                } catch (e: Exception) {
                    val msg = when (e) {
                        is UnknownHostException -> "地址不可达：主机名无法解析"
                        is ConnectException -> "连接被拒绝：请确认电脑已启动服务，且手机与电脑同一 WiFi"
                        is SocketTimeoutException -> "连接超时：请检查服务器地址，或关闭路由器「访客隔离」"
                        else -> apiErrorMessage(e)
                    }
                    binding.errorText.text = "$msg\n当前: ${Session.displayBaseUrl(requireContext())}"
                    Toast.makeText(requireContext(), "登录失败", Toast.LENGTH_SHORT).show()
                } finally {
                    _binding?.loginBtn?.isEnabled = true
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
