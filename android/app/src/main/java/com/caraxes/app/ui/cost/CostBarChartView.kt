package com.caraxes.app.ui.cost

import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import androidx.core.content.ContextCompat
import com.caraxes.app.R
import com.caraxes.app.data.CostBucket
import kotlin.math.max

class CostBarChartView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : View(context, attrs) {
    var onBarClick: ((CostBucket) -> Unit)? = null

    init {
        isClickable = true
    }

    private val bars = mutableListOf<CostBucket>()
    private var selectedKey = ""
    private val barRects = mutableListOf<RectF>()

    private val pine = ContextCompat.getColor(context, R.color.pine)
    private val inkSoft = ContextCompat.getColor(context, R.color.ink_soft)
    private val line = ContextCompat.getColor(context, R.color.line)

    private val barPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = inkSoft
        textAlign = Paint.Align.CENTER
        textSize = 11f * resources.displayMetrics.scaledDensity
    }
    private val valuePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = pine
        textAlign = Paint.Align.CENTER
        textSize = 10f * resources.displayMetrics.scaledDensity
        isFakeBoldText = true
    }
    private val axisPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = line
        strokeWidth = resources.displayMetrics.density
    }

    fun submit(data: List<CostBucket>, selected: String) {
        bars.clear()
        bars.addAll(data)
        selectedKey = selected
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        barRects.clear()
        if (bars.isEmpty()) return

        val density = resources.displayMetrics.density
        val padL = 8f * density
        val padR = 8f * density
        val padT = 22f * density
        val padB = 26f * density
        val innerW = width - padL - padR
        val innerH = height - padT - padB
        if (innerW <= 0f || innerH <= 0f) return

        val n = bars.size
        val gap = minOf(6f * density, innerW / n * 0.22f)
        val barW = max(2f, (innerW - gap * (n + 1)) / n)
        val maxVal = max(0.01, bars.maxOf { it.total })
        val baseline = height - padB
        canvas.drawLine(padL, baseline, width - padR, baseline, axisPaint)

        val dense = n > 16
        bars.forEachIndexed { i, bar ->
            val left = padL + gap + i * (barW + gap)
            val right = left + barW
            val h = (bar.total / maxVal * innerH).toFloat()
            val top = baseline - max(if (bar.total > 0) 2f * density else 0f, h)
            val rect = RectF(left, top, right, baseline)
            barRects.add(RectF(rect))
            barPaint.color = pine
            barPaint.alpha = when {
                bar.key == selectedKey -> 255
                bar.total > 0 -> 140
                else -> 40
            }
            canvas.drawRoundRect(rect, 3f * density, 3f * density, barPaint)

            val showLabel = !dense || i == 0 || i == n - 1 || (i + 1) % 5 == 0 || bar.key == selectedKey
            if (showLabel) {
                val label = bar.label.removeSuffix("日").removeSuffix("月")
                canvas.drawText(label, (left + right) / 2f, height - 8f * density, labelPaint)
            }
            if (bar.key == selectedKey && bar.total > 0) {
                canvas.drawText(
                    bar.total.toInt().toString(),
                    (left + right) / 2f,
                    top - 4f * density,
                    valuePaint,
                )
            }
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_DOWN) return true
        if (event.action != MotionEvent.ACTION_UP) return super.onTouchEvent(event)
        val x = event.x
        val y = event.y
        barRects.forEachIndexed { i, rect ->
            val hit = x >= rect.left && x <= rect.right && y <= rect.bottom + 24f
            if (hit) {
                bars.getOrNull(i)?.let { onBarClick?.invoke(it) }
                performClick()
                return true
            }
        }
        return super.onTouchEvent(event)
    }

    override fun performClick(): Boolean {
        super.performClick()
        return true
    }
}
