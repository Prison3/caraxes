package com.caraxes.app.ui.staff

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import androidx.appcompat.app.AlertDialog
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import com.caraxes.app.R
import com.caraxes.app.data.ApiClient
import com.caraxes.app.data.ManagerDisabledIn
import com.caraxes.app.data.ManagerOut
import com.caraxes.app.databinding.FragmentStaffBinding
import com.caraxes.app.ui.clearMsg
import com.caraxes.app.ui.fail
import com.caraxes.app.ui.promptPassword
import com.caraxes.app.ui.showMsg
import kotlinx.coroutines.launch

class StaffFragment : Fragment() {
    private var _binding: FragmentStaffBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: StaffAdapter
    private var allManagers: List<ManagerOut> = emptyList()

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentStaffBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = StaffAdapter(
            onEdit = { openEditor(it) },
            onToggle = { toggle(it) },
            onDelete = { confirmDelete(it) },
        )
        binding.list.layoutManager = LinearLayoutManager(requireContext())
        binding.list.adapter = adapter
        binding.addBtn.setOnClickListener { openEditor(null) }
        binding.searchBtn.setOnClickListener { render() }
        binding.searchInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                render()
                true
            } else false
        }
        load()
    }

    override fun onResume() {
        super.onResume()
        if (_binding != null) load()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun load() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                allManagers = ApiClient.get(requireContext()).listManagers()
                render()
            } catch (e: Exception) {
                showMsg(binding.staffMsg, fail(e), false)
            }
        }
    }

    private fun render() {
        val q = binding.searchInput.text?.toString()?.trim().orEmpty()
        val list = allManagers.filter {
            q.isBlank() ||
                it.username.contains(q, ignoreCase = true) ||
                (it.shop_name ?: "").contains(q, ignoreCase = true)
        }
        adapter.submit(list)
        binding.emptyText.isVisible = list.isEmpty()
        binding.emptyText.text = if (q.isBlank()) "暂无店长账号，点击下方添加" else "没有匹配的店长"
    }

    private fun openEditor(item: ManagerOut?) {
        findNavController().navigate(R.id.staffEditFragment, StaffEditFragment.args(item))
    }

    private fun toggle(item: ManagerOut) {
        val willDisable = !item.disabled
        val action = if (willDisable) "禁用" else "启用"
        AlertDialog.Builder(requireContext())
            .setTitle("${action}店长")
            .setMessage("确认${action}店长「${item.username}」？")
            .setPositiveButton("确定$action") { _, _ ->
                viewLifecycleOwner.lifecycleScope.launch {
                    try {
                        ApiClient.get(requireContext()).setManagerDisabled(
                            item.id,
                            ManagerDisabledIn(willDisable),
                        )
                        showMsg(binding.staffMsg, "店长已$action", true)
                        load()
                    } catch (e: Exception) {
                        showMsg(binding.staffMsg, fail(e), false)
                    }
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun confirmDelete(item: ManagerOut) {
        promptPassword("确认删除", "确认删除店长「${item.username}」？\n请输入登录密码后确认。") { password ->
            viewLifecycleOwner.lifecycleScope.launch {
                try {
                    ApiClient.get(requireContext()).deleteManager(item.id, password)
                    clearMsg(binding.staffMsg)
                    showMsg(binding.staffMsg, "店长已删除", true)
                    load()
                } catch (e: Exception) {
                    showMsg(binding.staffMsg, fail(e), false)
                }
            }
        }
    }
}
