package com.caraxes.app.ui.cost

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.caraxes.app.data.CostItem
import com.caraxes.app.data.formatMoney
import com.caraxes.app.databinding.ItemCostBinding

class CostAdapter : RecyclerView.Adapter<CostAdapter.VH>() {
    private val items = mutableListOf<CostItem>()

    fun submit(data: List<CostItem>) {
        items.clear()
        items.addAll(data)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemCostBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = items[position]
        holder.binding.title.text = item.name
        holder.binding.subtitle.text = if (item.count > 0) "${item.count} 笔" else "无订单"
        holder.binding.amount.text = "¥${formatMoney(item.total)}"
    }

    override fun getItemCount() = items.size

    class VH(val binding: ItemCostBinding) : RecyclerView.ViewHolder(binding.root)
}
