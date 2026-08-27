package com.caraxes.app.ui.create

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.caraxes.app.data.ApiClient
import com.caraxes.app.data.Catalog
import com.caraxes.app.data.OrderCreate
import com.caraxes.app.data.OrderOut
import com.caraxes.app.data.Session
import com.caraxes.app.data.almostEqual
import com.caraxes.app.databinding.FragmentCreateBinding
import com.caraxes.app.ui.OrderAdapter
import com.caraxes.app.ui.SUPPLIER_COLUMNS
import com.caraxes.app.ui.bindChoices
import com.caraxes.app.ui.clearMsg
import com.caraxes.app.ui.fail
import com.caraxes.app.ui.pickDate
import com.caraxes.app.ui.promptPassword
import com.caraxes.app.ui.selectedChoiceId
import com.caraxes.app.ui.showEditOrderDialog
import com.caraxes.app.ui.showMsg
import com.caraxes.app.ui.shopsToChoices
import com.caraxes.app.ui.suppliersToChoices
import com.caraxes.app.ui.todayIso
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.launch

class CreateFragment : Fragment() {
    private var _binding: FragmentCreateBinding? = null
    private val binding get() = _binding!!
    private var selectedShopId: Int? = null
    private var selectedSupplierId: Int? = null
    private lateinit var adapter: OrderAdapter

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentCreateBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = OrderAdapter(
            onEdit = { showEditOrderDialog(it) { loadRecent() } },
            onDelete = { confirmDelete(it) },
        )
        binding.recentList.layoutManager = LinearLayoutManager(requireContext())
        binding.recentList.adapter = adapter
        binding.orderDate.setText(todayIso())
        binding.orderDate.setOnClickListener {
            pickDate(binding.orderDate.text?.toString().orEmpty().ifBlank { todayIso() }) {
                binding.orderDate.setText(it)
            }
        }
        binding.submitBtn.setOnClickListener { submit() }
        loadCatalog()
    }

    override fun onResume() {
        super.onResume()
        if (_binding != null) loadCatalog()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun managerLocked(): Boolean = !Session.isAdmin(requireContext())

    private fun lockedShopId(): Int? =
        Session.shopId(requireContext()).takeIf { it > 0 }

    private fun loadCatalog() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val api = ApiClient.get(requireContext())
                Catalog.refresh(api)
                bindPickers()
                loadRecent()
            } catch (e: Exception) {
                showMsg(binding.formMsg, fail(e), false)
            }
        }
    }

    private fun bindPickers() {
        val locked = managerLocked()
        if (locked) selectedShopId = lockedShopId()
        if (selectedShopId == null) {
            selectedShopId = Catalog.shops.firstOrNull()?.id
        }
        binding.shopChips.bindChoices(
            shopsToChoices(Catalog.shops, allowEmpty = false),
            selectedShopId,
            locked = locked,
        ) { selectedShopId = it }
        binding.supplierChips.bindChoices(
            suppliersToChoices(Catalog.suppliers, allowEmpty = false),
            selectedSupplierId,
            locked = false,
            columns = SUPPLIER_COLUMNS,
        ) { selectedSupplierId = it }
    }

    private fun loadRecent() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val list = ApiClient.get(requireContext()).listOrders(limit = 10)
                adapter.submit(list)
                binding.recentList.isVisible = list.isNotEmpty()
                binding.recentEmpty.isVisible = list.isEmpty()
                binding.recentMeta.text = if (list.isEmpty()) "" else "最近 ${list.size} 条"
            } catch (e: Exception) {
                adapter.submit(emptyList())
                binding.recentList.isVisible = false
                binding.recentEmpty.isVisible = true
                binding.recentEmpty.text = fail(e)
            }
        }
    }

    private fun submit() {
        clearMsg(binding.formMsg)
        if (managerLocked()) selectedShopId = lockedShopId()
        val shopId = selectedShopId ?: binding.shopChips.selectedChoiceId()
        val supplierId = selectedSupplierId ?: binding.supplierChips.selectedChoiceId()
        val date = binding.orderDate.text?.toString().orEmpty()
        val amount = binding.dailyTotal.text?.toString()?.toDoubleOrNull() ?: 0.0
        if (shopId == null || supplierId == null) {
            showMsg(binding.formMsg, "请选择店铺和供应商", false)
            return
        }
        if (date.isBlank()) {
            showMsg(binding.formMsg, "请选择日期", false)
            return
        }
        if (amount <= 0) {
            showMsg(binding.formMsg, "单日总金额必须大于 0", false)
            return
        }
        val payload = OrderCreate(date, shopId, supplierId, amount)
        binding.submitBtn.isEnabled = false
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val existing = findDuplicate(payload)
                if (existing != null) {
                    val ok = confirmDuplicate()
                    if (!ok) {
                        showMsg(binding.formMsg, "已取消提交（判定为重复）", false)
                        return@launch
                    }
                }
                ApiClient.get(requireContext()).createOrder(payload)
                binding.dailyTotal.setText("")
                showMsg(binding.formMsg, "提交成功", true)
                loadRecent()
            } catch (e: Exception) {
                showMsg(binding.formMsg, fail(e), false)
            } finally {
                _binding?.submitBtn?.isEnabled = true
            }
        }
    }

    private suspend fun findDuplicate(payload: OrderCreate): OrderOut? {
        val orders = ApiClient.get(requireContext()).listOrders(
            orderDate = payload.order_date,
            shopId = payload.shop_id,
            supplierId = payload.supplier_id,
        )
        return orders.firstOrNull {
            it.order_date == payload.order_date &&
                it.shop_id == payload.shop_id &&
                it.supplier_id == payload.supplier_id &&
                almostEqual(it.daily_total, payload.daily_total)
        }
    }

    private suspend fun confirmDuplicate(): Boolean {
        return kotlinx.coroutines.suspendCancellableCoroutine { cont ->
            MaterialAlertDialogBuilder(requireContext())
                .setTitle("是否提交")
                .setMessage("订单信息可能重复，是否继续提交")
                .setPositiveButton("是") { _, _ -> cont.resume(true) {} }
                .setNegativeButton("否") { _, _ -> cont.resume(false) {} }
                .setOnCancelListener { cont.resume(false) {} }
                .show()
        }
    }

    private fun confirmDelete(order: OrderOut) {
        promptPassword("确认删除", "确认删除这条订单？\n请输入登录密码后确认。") { password ->
            viewLifecycleOwner.lifecycleScope.launch {
                try {
                    ApiClient.get(requireContext()).deleteOrder(order.id, password)
                    showMsg(binding.formMsg, "已删除", true)
                    loadRecent()
                } catch (e: Exception) {
                    showMsg(binding.formMsg, fail(e), false)
                }
            }
        }
    }
}
