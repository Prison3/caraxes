package com.caraxes.app.ui.query

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.caraxes.app.R
import com.caraxes.app.data.ApiClient
import com.caraxes.app.data.Catalog
import com.caraxes.app.data.OrderOut
import com.caraxes.app.data.Session
import com.caraxes.app.data.formatMoney
import com.caraxes.app.databinding.FragmentQueryBinding
import com.caraxes.app.ui.OrderAdapter
import com.caraxes.app.ui.SUPPLIER_COLUMNS
import com.caraxes.app.ui.bindChoices
import com.caraxes.app.ui.clearMsg
import com.caraxes.app.ui.currentMonth
import com.caraxes.app.ui.fail
import com.caraxes.app.ui.pickDate
import com.caraxes.app.ui.pickMonth
import com.caraxes.app.ui.promptPassword
import com.caraxes.app.ui.selectedChoiceId
import com.caraxes.app.ui.showEditOrderDialog
import com.caraxes.app.ui.showMsg
import com.caraxes.app.ui.shopsToChoices
import com.caraxes.app.ui.suppliersToChoices
import com.caraxes.app.ui.todayIso
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

class QueryFragment : Fragment() {
    private var _binding: FragmentQueryBinding? = null
    private val binding get() = _binding!!
    private var selectedShopId: Int? = null
    private var selectedSupplierId: Int? = null
    private lateinit var adapter: OrderAdapter
    private var queryJob: Job? = null
    private var ready = false

    private enum class DateMode { DAY, RANGE, MONTH }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentQueryBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = OrderAdapter(
            onEdit = { showEditOrderDialog(it) { query() } },
            onDelete = { confirmDelete(it) },
        )
        binding.orderList.layoutManager = LinearLayoutManager(requireContext())
        binding.orderList.adapter = adapter
        binding.dateFrom.setText(todayIso())
        binding.dateTo.setText(todayIso())
        applyDateMode(DateMode.DAY)

        binding.dateModeGroup.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (!isChecked) return@addOnButtonCheckedListener
            applyDateMode(
                when (checkedId) {
                    R.id.modeRange -> DateMode.RANGE
                    R.id.modeMonth -> DateMode.MONTH
                    else -> DateMode.DAY
                },
            )
            if (ready) query()
        }
        binding.dateFrom.setOnClickListener {
            when (currentMode()) {
                DateMode.MONTH -> pickMonth(binding.dateFrom.text?.toString().orEmpty().ifBlank { currentMonth() }) {
                    binding.dateFrom.setText(it)
                    query()
                }
                else -> pickDate(binding.dateFrom.text?.toString().orEmpty().ifBlank { todayIso() }) {
                    binding.dateFrom.setText(it)
                    query()
                }
            }
        }
        binding.dateTo.setOnClickListener {
            pickDate(binding.dateTo.text?.toString().orEmpty().ifBlank { todayIso() }) {
                binding.dateTo.setText(it)
                query()
            }
        }
        binding.resetBtn.setOnClickListener { reset() }
        loadCatalog(thenQuery = true)
    }

    override fun onResume() {
        super.onResume()
        if (_binding != null) loadCatalog(thenQuery = false)
    }

    override fun onDestroyView() {
        queryJob?.cancel()
        super.onDestroyView()
        _binding = null
    }

    private fun managerLocked(): Boolean = !Session.isAdmin(requireContext())

    private fun lockedShopId(): Int? = Session.shopId(requireContext()).takeIf { it > 0 }

    private fun currentMode(): DateMode = when (binding.dateModeGroup.checkedButtonId) {
        R.id.modeRange -> DateMode.RANGE
        R.id.modeMonth -> DateMode.MONTH
        else -> DateMode.DAY
    }

    private fun applyDateMode(mode: DateMode) {
        binding.dateToLayout.isVisible = mode == DateMode.RANGE
        binding.dateFromLayout.hint = when (mode) {
            DateMode.MONTH -> "月份"
            DateMode.RANGE -> "起始日期"
            DateMode.DAY -> "日期"
        }
        val current = binding.dateFrom.text?.toString().orEmpty()
        when (mode) {
            DateMode.MONTH -> {
                if (current.length != 7) binding.dateFrom.setText(currentMonth())
            }
            else -> {
                if (current.length != 10) binding.dateFrom.setText(todayIso())
            }
        }
    }

    private fun loadCatalog(thenQuery: Boolean) {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                Catalog.refresh(ApiClient.get(requireContext()))
                bindPickers()
                ready = true
                if (thenQuery) query()
            } catch (e: Exception) {
                ready = true
                showMsg(binding.queryMsg, fail(e), false)
            }
        }
    }

    private fun bindPickers() {
        val locked = managerLocked()
        if (locked) selectedShopId = lockedShopId()
        binding.shopChips.bindChoices(
            shopsToChoices(Catalog.shops, allowEmpty = !locked),
            selectedShopId,
            locked = locked,
        ) { selectedShopId = it; if (ready) query() }
        binding.supplierChips.bindChoices(
            suppliersToChoices(Catalog.suppliers, allowEmpty = true),
            selectedSupplierId,
            locked = false,
            columns = SUPPLIER_COLUMNS,
        ) { selectedSupplierId = it; if (ready) query() }
    }

    private fun reset() {
        selectedShopId = if (managerLocked()) lockedShopId() else null
        selectedSupplierId = null
        binding.dateModeGroup.check(R.id.modeDay)
        applyDateMode(DateMode.DAY)
        binding.dateFrom.setText(todayIso())
        binding.dateTo.setText(todayIso())
        bindPickers()
        query()
    }

    private fun query() {
        clearMsg(binding.queryMsg)
        if (managerLocked()) selectedShopId = lockedShopId()
        val shopId = selectedShopId ?: binding.shopChips.selectedChoiceId()
        val supplierId = selectedSupplierId ?: binding.supplierChips.selectedChoiceId()
        val from = binding.dateFrom.text?.toString().orEmpty()
        val to = binding.dateTo.text?.toString().orEmpty()
        binding.listMeta.text = "加载中…"
        queryJob?.cancel()
        queryJob = viewLifecycleOwner.lifecycleScope.launch {
            try {
                val api = ApiClient.get(requireContext())
                val list = when (currentMode()) {
                    DateMode.DAY -> api.listOrders(
                        orderDate = from.ifBlank { null },
                        shopId = shopId,
                        supplierId = supplierId,
                    )
                    DateMode.RANGE -> {
                        if (from.isNotBlank() && to.isNotBlank() && from > to) {
                            showMsg(binding.queryMsg, "起始日期不能晚于结束日期", false)
                            emptyList()
                        } else {
                            api.listOrders(
                                dateFrom = from.ifBlank { null },
                                dateTo = to.ifBlank { null },
                                shopId = shopId,
                                supplierId = supplierId,
                            )
                        }
                    }
                    DateMode.MONTH -> api.listOrders(
                        month = from.ifBlank { null },
                        shopId = shopId,
                        supplierId = supplierId,
                    )
                }
                render(list)
            } catch (e: kotlinx.coroutines.CancellationException) {
                throw e
            } catch (e: Exception) {
                render(emptyList())
                showMsg(binding.queryMsg, fail(e), false)
            }
        }
    }

    private fun render(list: List<OrderOut>) {
        adapter.submit(list)
        binding.orderList.isVisible = list.isNotEmpty()
        binding.emptyHint.isVisible = list.isEmpty()
        binding.listMeta.text = if (list.isEmpty()) "" else "共 ${list.size} 条"
        if (list.isEmpty()) {
            binding.sumMeta.isVisible = false
        } else {
            val total = list.sumOf { it.daily_total }
            binding.sumMeta.isVisible = true
            binding.sumMeta.text = "合计金额：¥${formatMoney(total)}"
        }
    }

    private fun confirmDelete(order: OrderOut) {
        promptPassword("确认删除", "确认删除这条订单？\n请输入登录密码后确认。") { password ->
            viewLifecycleOwner.lifecycleScope.launch {
                try {
                    ApiClient.get(requireContext()).deleteOrder(order.id, password)
                    showMsg(binding.queryMsg, "已删除", true)
                    query()
                } catch (e: Exception) {
                    showMsg(binding.queryMsg, fail(e), false)
                }
            }
        }
    }
}
