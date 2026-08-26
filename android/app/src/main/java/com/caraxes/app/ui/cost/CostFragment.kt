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
import com.caraxes.app.ui.currentYear
import com.caraxes.app.ui.fail
import com.caraxes.app.ui.pickCostTime
import com.caraxes.app.ui.showMsg
import com.caraxes.app.ui.shopsToChoices
import com.caraxes.app.ui.todayIso
import kotlinx.coroutines.launch
import java.util.Calendar

class CostFragment : Fragment() {
    private var _binding: FragmentCostBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: CostAdapter
    private var started = false
    private var yearMode = false
    private var selectedYear = 0
    private var selectedDay = ""
    private var selectedMonth = ""
    private var selectedShopId: Int? = null
    private var chartKind = CostChartKind.BAR

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentCostBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = CostAdapter()
        binding.costList.layoutManager = LinearLayoutManager(requireContext())
        binding.costList.adapter = adapter
        selectedYear = currentYear()
        selectedDay = todayIso()
        selectedMonth = currentMonth()
        bindFilterChips()
        binding.chartPrev.setOnClickListener { shiftPeriod(-1) }
        binding.chartNext.setOnClickListener { shiftPeriod(1) }
        binding.chartTitle.setOnClickListener { openTimePicker() }
        binding.chartTypeGroup.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (!isChecked || !started) return@addOnButtonCheckedListener
            val next = when (checkedId) {
                R.id.chartTypeKline -> CostChartKind.KLINE
                R.id.chartTypeCalendar -> CostChartKind.CALENDAR
                else -> CostChartKind.BAR
            }
            if (next != chartKind) {
                chartKind = next
                query()
            }
        }
        binding.chart.onBarClick = { bar ->
            if (started && bar.key.isNotBlank()) {
                if (chartKind == CostChartKind.CALENDAR && yearMode && bar.key.length >= 10) {
                    yearMode = false
                    selectedDay = bar.key.take(10)
                    selectedMonth = bar.key.take(7)
                    selectedYear = bar.key.take(4).toIntOrNull() ?: selectedYear
                    query()
                } else if (yearMode) {
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
        updateChartTitle()
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

    private fun bindFilterChips() {
        binding.filterChips.bindChoices(
            shopsToChoices(Catalog.shops, allowEmpty = true),
            selectedShopId,
        ) {
            selectedShopId = it
            if (started) query()
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

    private fun openTimePicker() {
        val monthSeed = selectedMonth.ifBlank {
            selectedDay.take(7).ifBlank { currentMonth() }
        }
        pickCostTime(
            currentYear = selectedYear.takeIf { it > 0 } ?: currentYear(),
            currentMonth = monthSeed,
            onYear = { year ->
                yearMode = true
                selectedYear = year
                selectedMonth = ""
                query()
            },
            onMonth = { month ->
                yearMode = false
                selectedMonth = month
                selectedYear = month.take(4).toIntOrNull() ?: selectedYear
                selectedDay = if (todayIso().startsWith(month)) todayIso() else "$month-01"
                query()
            },
        )
    }

    private fun shiftPeriod(delta: Int) {
        if (yearMode) {
            selectedYear = (selectedYear.takeIf { it > 0 } ?: currentYear()) + delta
            selectedMonth = ""
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
            selectedYear = cal.get(Calendar.YEAR)
        }
        query()
    }

    private fun query() {
        clearMsg(binding.costMsg)
        binding.listMeta.text = "加载中…"
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val report = if (yearMode) {
                    val year = selectedYear.takeIf { it > 0 } ?: currentYear()
                    ApiClient.get(requireContext()).listCosts(
                        groupBy = "shop",
                        period = "month",
                        month = selectedMonth.takeIf { it.length >= 7 && it.startsWith("%04d".format(year)) },
                        year = year,
                        chart = chartKind.apiValue(),
                        shopId = selectedShopId,
                    )
                } else {
                    ApiClient.get(requireContext()).listCosts(
                        groupBy = "shop",
                        period = "day",
                        orderDate = selectedDay.ifBlank { todayIso() },
                        chart = chartKind.apiValue(),
                        shopId = selectedShopId,
                    )
                }
                render(report)
            } catch (e: Exception) {
                render(CostReportOut())
                showMsg(binding.costMsg, fail(e), false)
            }
        }
    }

    private fun render(report: CostReportOut) {
        val items = report.items
        adapter.submit(items)
        binding.costList.isVisible = items.isNotEmpty()
        binding.emptyHint.isVisible = items.isEmpty()
        binding.listMeta.text = if (items.isEmpty()) "" else "共 ${items.size} 个店铺"
        if (items.isEmpty()) {
            binding.sumMeta.isVisible = false
        } else {
            binding.sumMeta.isVisible = true
            binding.sumMeta.text = "合计 ${report.count} 笔  ·  ¥${formatMoney(report.total)}"
        }
        val selected = report.selected.ifBlank {
            if (yearMode) selectedMonth.ifBlank { selectedYear.toString() } else selectedDay
        }
        if (yearMode) {
            selected.take(4).toIntOrNull()?.let { selectedYear = it }
            selectedMonth = if (selected.length >= 7) selected.take(7) else ""
        } else if (selected.length >= 10) {
            selectedDay = selected.take(10)
            selectedMonth = selected.take(7)
            selected.take(4).toIntOrNull()?.let { selectedYear = it }
        }
        updateChartTitle()
        binding.chart.submit(report.buckets, selected, chartKind)
        binding.chart.isVisible = report.buckets.isNotEmpty()
        binding.chartHead.isVisible = true
        binding.chartTypeGroup.isVisible = true
    }

    private fun updateChartTitle() {
        binding.chartTitle.text = if (yearMode) {
            val year = selectedYear.takeIf { it > 0 } ?: currentYear()
            "${year}年 ▾"
        } else {
            val month = selectedMonth.ifBlank { selectedDay.take(7).ifBlank { currentMonth() } }
            val parts = month.split("-")
            if (parts.size == 2) "${parts[0]}年${parts[1].toInt()}月 ▾" else "选择时间 ▾"
        }
    }
}

private fun CostChartKind.apiValue(): String = when (this) {
    CostChartKind.BAR -> "bar"
    CostChartKind.KLINE -> "kline"
    CostChartKind.CALENDAR -> "calendar"
}
