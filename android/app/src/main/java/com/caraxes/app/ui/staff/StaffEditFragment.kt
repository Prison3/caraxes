package com.caraxes.app.ui.staff

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.caraxes.app.data.ApiClient
import com.caraxes.app.data.Catalog
import com.caraxes.app.data.ManagerCreate
import com.caraxes.app.data.ManagerOut
import com.caraxes.app.data.ManagerUpdate
import com.caraxes.app.databinding.FragmentStaffEditBinding
import com.caraxes.app.ui.bindChoices
import com.caraxes.app.ui.clearMsg
import com.caraxes.app.ui.fail
import com.caraxes.app.ui.promptPassword
import com.caraxes.app.ui.selectedChoiceId
import com.caraxes.app.ui.shopsToChoices
import com.caraxes.app.ui.showMsg
import kotlinx.coroutines.launch

class StaffEditFragment : Fragment() {
    private var _binding: FragmentStaffEditBinding? = null
    private val binding get() = _binding!!
    private var staffId: Int = -1
    private var originalUsername: String = ""
    private var selectedShopId: Int? = null

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentStaffEditBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        staffId = arguments?.getInt(ARG_ID, -1) ?: -1
        originalUsername = arguments?.getString(ARG_USERNAME).orEmpty()
        selectedShopId = arguments?.getInt(ARG_SHOP_ID, 0)?.takeIf { it > 0 }
        val isEdit = staffId > 0

        binding.pageTitle.text = if (isEdit) "编辑店长" else "添加店长"
        binding.pageSubtitle.text = if (isEdit) {
            "修改用户名、密码或绑定店铺后保存"
        } else {
            "设置用户名、密码和绑定店铺后保存"
        }
        binding.passwordLayout.hint = if (isEdit) "密码（不改可留空）" else "密码"
        binding.deleteBtn.isVisible = isEdit
        if (isEdit) {
            binding.inputUsername.setText(originalUsername)
        }

        binding.backBtn.setOnClickListener { findNavController().navigateUp() }
        binding.cancelBtn.setOnClickListener { findNavController().navigateUp() }
        binding.saveBtn.setOnClickListener { save() }
        binding.deleteBtn.setOnClickListener { confirmDelete() }
        loadShops()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun loadShops() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                Catalog.refresh(ApiClient.get(requireContext()))
                renderShops()
            } catch (e: Exception) {
                showMsg(binding.editMsg, fail(e), false)
            }
        }
    }

    private fun renderShops() {
        binding.shopChips.bindChoices(
            shopsToChoices(Catalog.shops, allowEmpty = false),
            selectedShopId,
        ) { selectedShopId = it }
    }

    private fun save() {
        val username = binding.inputUsername.text?.toString()?.trim().orEmpty()
        val password = binding.inputPassword.text?.toString().orEmpty()
        val shopId = (binding.shopChips.selectedChoiceId() ?: selectedShopId)?.takeIf { it > 0 }
        val isEdit = staffId > 0
        when {
            username.isBlank() -> {
                showMsg(binding.editMsg, "请输入用户名", false)
                return
            }
            shopId == null -> {
                showMsg(binding.editMsg, "请选择绑定店铺", false)
                return
            }
            !isEdit && password.length < 4 -> {
                showMsg(binding.editMsg, "密码至少 4 位", false)
                return
            }
            isEdit && password.isNotEmpty() && password.length < 4 -> {
                showMsg(binding.editMsg, "密码至少 4 位", false)
                return
            }
        }
        val boundShopId = shopId ?: return
        binding.saveBtn.isEnabled = false
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val api = ApiClient.get(requireContext())
                if (!isEdit) {
                    api.createManager(ManagerCreate(username, password, boundShopId))
                } else {
                    api.updateManager(
                        staffId,
                        ManagerUpdate(
                            username = username,
                            password = password.ifBlank { null },
                            shop_id = boundShopId,
                        ),
                    )
                }
                showMsg(binding.editMsg, "已保存", true)
                findNavController().navigateUp()
            } catch (e: Exception) {
                showMsg(binding.editMsg, fail(e), false)
                binding.saveBtn.isEnabled = true
            }
        }
    }

    private fun confirmDelete() {
        val name = binding.inputUsername.text?.toString()?.trim().orEmpty()
            .ifBlank { originalUsername }
            .ifBlank { "该店长" }
        promptPassword("确认删除", "确认删除店长「$name」？\n请输入登录密码后确认。") { password ->
            viewLifecycleOwner.lifecycleScope.launch {
                try {
                    ApiClient.get(requireContext()).deleteManager(staffId, password)
                    clearMsg(binding.editMsg)
                    findNavController().navigateUp()
                } catch (e: Exception) {
                    showMsg(binding.editMsg, fail(e), false)
                }
            }
        }
    }

    companion object {
        const val ARG_ID = "staff_id"
        const val ARG_USERNAME = "username"
        const val ARG_SHOP_ID = "shop_id"

        fun args(item: ManagerOut? = null): Bundle = Bundle().apply {
            putInt(ARG_ID, item?.id ?: -1)
            putString(ARG_USERNAME, item?.username.orEmpty())
            putInt(ARG_SHOP_ID, item?.shop_id ?: 0)
        }
    }
}
