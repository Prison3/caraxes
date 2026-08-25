package com.caraxes.app.ui.cost

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
import com.caraxes.app.data.CostReportOut
import com.caraxes.app.data.formatMoney
import com.caraxes.app.databinding.FragmentCostBinding
import com.caraxes.app.ui.bindChoices
import com.caraxes.app.ui.clearMsg
import com.caraxes.app.ui.currentMonth
import com.caraxes.app.ui.fail
import com.caraxes.app.ui.showMsg
import com.caraxes.app.ui.shopsToChoices
import com.caraxes.app.ui.suppliersToChoices
import com.caraxes.app.ui.todayIso
import kotlinx.coroutines.launch
import java.util.Calendar

class CostFragment : Fragment() {
    private var _binding: FragmentCostBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: CostAdapter
    private var started = false
    private var selectedDay = ""
    private var selectedMonth = ""
    private var selectedShopId: Int? = null
    private var selectedSupplierId: Int? = null

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentCostBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = CostAdapter()
        binding.costList.layoutManager = LinearLayoutManager(requireContext())
        binding.costList.adapter = adapter
        selectedDay = todayIso()
        selectedMonth = currentMonth()
        bindFilterChips()
        binding.groupByGroup.addOnButtonCheckedListener { _, _, isChecked ->
            if (!isChecked) return@addOnButtonCheckedListener
            bindFilterChips()
            if (started) query()
        }
        binding.periodGroup.addOnButtonCheckedListener { _, _, isChecked ->
            if (!isChecked) return@addOnButtonCheckedListener
            if (started) query()
        }
        binding.queryBtn.setOnClickListener { query() }
        binding.chartPrev.setOnClickListener { shiftPeriod(-1) }
        binding.chartNext.setOnClickListener { shiftPeriod(1) }
        binding.chart.onBarClick = { bar ->
            if (started && bar.key.isNotBlank()) {
                if (isMonth()) {
                    if (bar.key != selectedMonth) {
                        selectedMonth = bar.key
                        query()
                    }
                } else if (bar.key != selectedDay) {
                    selectedDay = bar.key
                    if (bar.key.length >= 7) selectedMonth = bar.key.take(7)
                    query()
                }
            }
        }
        started = true
        loadCatalog()
    }

    override fun onResume() {
        super.onResume()
        if (_binding != null && started) query()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun isMonth(): Boolean = binding.periodGroup.checkedButtonId == R.id.periodMonth

    private fun groupBy(): String =
        if (binding.groupByGroup.checkedButtonId == R.id.groupSupplier) "supplier" else "shop"

    private fun bindFilterChips() {
        if (groupBy() == "shop") {
            binding.filterLabel.text = "店铺"
            binding.filterChips.bindChoices(
                shopsToChoices(Catalog.shops, allowEmpty = true),
                selectedShopId,
            ) {
                selectedShopId = it
                if (started) query()
            }
        } else {
            binding.filterLabel.text = "供应商"
            binding.filterChips.bindChoices(
                suppliersToChoices(Catalog.suppliers, allowEmpty = true),
                selectedSupplierId,
            ) {
                selectedSupplierId = it
                if (started) query()
            }
        }
    }

    private fun loadCatalog() {
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                Catalog.refresh(ApiClient.get(requireContext()))
                bindFilterChips()
                query()
            } catch (e: Exception) {
                showMsg(binding.costMsg, fail(e), false)
                query()
            }
        }
    }

    private fun shiftPeriod(delta: Int) {
        if (isMonth()) {
            val parts = selectedMonth.ifBlank { currentMonth() }.split("-")
            val year = (parts.getOrNull(0)?.toIntOrNull() ?: Calendar.getInstance().get(Calendar.YEAR)) + delta
            val month = parts.getOrNull(1)?.toIntOrNull() ?: 1
            selectedMonth = "%04d-%02d".format(year, month)
        } else {
            val parts = selectedDay.ifBlank { todayIso() }.split("-")
            val cal = Calendar.getInstance()
            if (parts.size >= 3) {
                runCatching { cal.set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt()) }
            }
            cal.add(Calendar.MONTH, delta)
            selectedDay = "%04d-%02d-%02d".format(
                cal.get(Calendar.YEAR),
                cal.get(Calendar.MONTH) + 1,
                cal.get(Calendar.DAY_OF_MONTH),
            )
            selectedMonth = selectedDay.take(7)
        }
        query()
    }

    private fun query() {
        clearMsg(binding.costMsg)
        binding.queryBtn.isEnabled = false
        binding.listMeta.text = "加载中…"
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val shopId = if (groupBy() == "shop") selectedShopId else null
                val supplierId = if (groupBy() == "supplier") selectedSupplierId else null
                val report = if (isMonth()) {
                    ApiClient.get(requireContext()).listCosts(
                        groupBy = groupBy(),
                        period = "month",
                        month = selectedMonth.ifBlank { currentMonth() },
                        shopId = shopId,
                        supplierId = supplierId,
                    )
                } else {
                    ApiClient.get(requireContext()).listCosts(
                        groupBy = groupBy(),
                        period = "day",
                        orderDate = selectedDay.ifBlank { todayIso() },
                        shopId = shopId,
                        supplierId = supplierId,
                    )
                }
                render(report)
            } catch (e: Exception) {
                render(CostReportOut())
                showMsg(binding.costMsg, fail(e), false)
            } finally {
                _binding?.queryBtn?.isEnabled = true
            }
        }
    }

    private fun render(report: CostReportOut) {
        val items = report.items
        adapter.submit(items)
        binding.costList.isVisible = items.isNotEmpty()
        binding.emptyHint.isVisible = items.isEmpty()
        val kind = if (report.group_by == "supplier") "供应商" else "店铺"
        binding.listMeta.text = if (items.isEmpty()) "" else "共 ${items.size} 个$kind"
        if (items.isEmpty()) {
            binding.sumMeta.isVisible = false
        } else {
            binding.sumMeta.isVisible = true
            binding.sumMeta.text = "合计 ${report.count} 笔  ·  ¥${formatMoney(report.total)}"
        }
        val selected = report.selected.ifBlank {
            if (isMonth()) selectedMonth else selectedDay
        }
        if (isMonth() && selected.length >= 7) selectedMonth = selected.take(7)
        if (!isMonth() && selected.length >= 10) {
            selectedDay = selected.take(10)
            selectedMonth = selected.take(7)
        }
        binding.chartTitle.text = if (isMonth()) {
            val year = selected.take(4).ifBlank { currentMonth().take(4) }
            "月柱状 · ${year}年"
        } else {
            val month = selected.take(7).ifBlank { currentMonth() }
            val parts = month.split("-")
            if (parts.size == 2) "日柱状 · ${parts[0]}年${parts[1].toInt()}月" else "日柱状"
        }
        binding.chart.submit(report.buckets, selected)
        val hasChart = report.buckets.isNotEmpty()
        binding.chart.isVisible = hasChart
        binding.chartHead.isVisible = hasChart
    }
}
