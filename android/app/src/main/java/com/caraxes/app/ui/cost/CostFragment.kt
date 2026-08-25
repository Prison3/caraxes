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
import com.caraxes.app.data.CostReportOut
import com.caraxes.app.data.formatMoney
import com.caraxes.app.databinding.FragmentCostBinding
import com.caraxes.app.ui.clearMsg
import com.caraxes.app.ui.currentMonth
import com.caraxes.app.ui.fail
import com.caraxes.app.ui.pickDate
import com.caraxes.app.ui.pickMonth
import com.caraxes.app.ui.showMsg
import com.caraxes.app.ui.todayIso
import kotlinx.coroutines.launch

class CostFragment : Fragment() {
    private var _binding: FragmentCostBinding? = null
    private val binding get() = _binding!!
    private lateinit var adapter: CostAdapter
    private var started = false

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = FragmentCostBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        adapter = CostAdapter()
        binding.costList.layoutManager = LinearLayoutManager(requireContext())
        binding.costList.adapter = adapter
        applyPeriod()
        binding.groupByGroup.addOnButtonCheckedListener { _, _, isChecked ->
            if (isChecked && started) query()
        }
        binding.periodGroup.addOnButtonCheckedListener { _, _, isChecked ->
            if (!isChecked) return@addOnButtonCheckedListener
            applyPeriod()
            if (started) query()
        }
        binding.periodValue.setOnClickListener {
            val current = binding.periodValue.text?.toString().orEmpty()
            if (isMonth()) {
                pickMonth(current.ifBlank { currentMonth() }) {
                    binding.periodValue.setText(it)
                    if (started) query()
                }
            } else {
                pickDate(current.ifBlank { todayIso() }) {
                    binding.periodValue.setText(it)
                    if (started) query()
                }
            }
        }
        binding.queryBtn.setOnClickListener { query() }
        started = true
        query()
    }

    override fun onResume() {
        super.onResume()
        if (_binding != null) query()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }

    private fun isMonth(): Boolean = binding.periodGroup.checkedButtonId == R.id.periodMonth

    private fun groupBy(): String =
        if (binding.groupByGroup.checkedButtonId == R.id.groupSupplier) "supplier" else "shop"

    private fun applyPeriod() {
        if (isMonth()) {
            binding.periodValueLayout.hint = "月份"
            val current = binding.periodValue.text?.toString().orEmpty()
            if (current.length != 7) binding.periodValue.setText(currentMonth())
        } else {
            binding.periodValueLayout.hint = "日期"
            val current = binding.periodValue.text?.toString().orEmpty()
            if (current.length != 10) binding.periodValue.setText(todayIso())
        }
    }

    private fun query() {
        clearMsg(binding.costMsg)
        val value = binding.periodValue.text?.toString().orEmpty()
        binding.queryBtn.isEnabled = false
        binding.listMeta.text = "加载中…"
        viewLifecycleOwner.lifecycleScope.launch {
            try {
                val report = if (isMonth()) {
                    ApiClient.get(requireContext()).listCosts(
                        groupBy = groupBy(),
                        period = "month",
                        month = value.ifBlank { currentMonth() },
                    )
                } else {
                    ApiClient.get(requireContext()).listCosts(
                        groupBy = groupBy(),
                        period = "day",
                        orderDate = value.ifBlank { todayIso() },
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
    }
}
