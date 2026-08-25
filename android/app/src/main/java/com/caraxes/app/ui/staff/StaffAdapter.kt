package com.caraxes.app.ui.staff

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.core.view.isVisible
import androidx.recyclerview.widget.RecyclerView
import com.caraxes.app.R
import com.caraxes.app.data.ManagerOut
import com.caraxes.app.databinding.ItemStaffBinding

class StaffAdapter(
    private val onEdit: (ManagerOut) -> Unit,
    private val onLogin: (ManagerOut) -> Unit,
    private val onToggle: (ManagerOut) -> Unit,
    private val onDelete: (ManagerOut) -> Unit,
) : RecyclerView.Adapter<StaffAdapter.VH>() {
    private val items = mutableListOf<ManagerOut>()

    fun submit(data: List<ManagerOut>) {
        items.clear()
        items.addAll(data)
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VH {
        val binding = ItemStaffBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VH(binding)
    }

    override fun onBindViewHolder(holder: VH, position: Int) {
        val item = items[position]
        val context = holder.binding.root.context
        holder.binding.title.text = item.username
        holder.binding.subtitle.text = item.shop_name?.ifBlank { null } ?: "未绑定店铺"
        holder.binding.badge.text = if (item.disabled) "已禁用" else "启用"
        holder.binding.badge.setBackgroundResource(
            if (item.disabled) R.drawable.bg_badge_warn else R.drawable.bg_badge,
        )
        holder.binding.badge.setTextColor(
            ContextCompat.getColor(context, if (item.disabled) R.color.cinnabar else R.color.pine),
        )
        holder.binding.loginBtn.isVisible = !item.disabled
        holder.binding.toggleBtn.text = if (item.disabled) "启用" else "禁用"
        holder.binding.root.setOnClickListener { onEdit(item) }
        holder.binding.loginBtn.setOnClickListener { onLogin(item) }
        holder.binding.toggleBtn.setOnClickListener { onToggle(item) }
        holder.binding.deleteBtn.setOnClickListener { onDelete(item) }
    }

    override fun getItemCount() = items.size

    class VH(val binding: ItemStaffBinding) : RecyclerView.ViewHolder(binding.root)
}
