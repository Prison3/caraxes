package com.caraxes.app.ui

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.caraxes.app.data.OrderOut
import com.caraxes.app.data.formatMoney
import com.caraxes.app.databinding.ItemOrderBinding

class OrderAdapter(
    private val onEdit: (OrderOut) -> Unit,
    private val onDelete: (OrderOut) -> Unit,
) : RecyclerView.Adapter<OrderAdapter.VH>() {
    private val items = mutableListOf<OrderOut>()

    fun submit(data: List<OrderOut>) {
        items.clear()
        items.addAll(data)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemOrderBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val order = items[position]
        holder.binding.title.text = order.order_no.ifBlank { "#${order.id}" }
        holder.binding.amount.text = "¥${formatMoney(order.daily_total)}"
        holder.binding.subtitle.text = "${order.shop_name}  ·  ${order.order_date}  ·  ${order.supplier_name}"
        holder.binding.editBtn.setOnClickListener { onEdit(order) }
        holder.binding.deleteBtn.setOnClickListener { onDelete(order) }
    }

    override fun getItemCount() = items.size

    class VH(val binding: ItemOrderBinding) : RecyclerView.ViewHolder(binding.root)
}
