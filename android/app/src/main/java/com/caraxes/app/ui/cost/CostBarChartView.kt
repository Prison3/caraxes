package com.caraxes.app.ui.cost

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import androidx.core.content.ContextCompat
import com.caraxes.app.R
import com.caraxes.app.data.CostBucket
import java.util.Calendar
import kotlin.math.max
import kotlin.math.min

enum class CostChartKind {
    BAR,
    KLINE,
    CALENDAR,
}

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
    private var kind = CostChartKind.BAR
    private val hitRects = mutableListOf<Pair<RectF, CostBucket>>()

    private val pine = ContextCompat.getColor(context, R.color.pine)
    private val cinnabar = ContextCompat.getColor(context, R.color.cinnabar)
    private val inkSoft = ContextCompat.getColor(context, R.color.ink_soft)
    private val ink = ContextCompat.getColor(context, R.color.ink)
    private val line = ContextCompat.getColor(context, R.color.line)
    private val gold = ContextCompat.getColor(context, R.color.gold)

    private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { style = Paint.Style.FILL }
    private val strokePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = resources.displayMetrics.density
    }
    private val labelPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = inkSoft
        textAlign = Paint.Align.CENTER
        textSize = 11f * resources.displayMetrics.scaledDensity
    }
    private val amountPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = pine
        textAlign = Paint.Align.CENTER
        textSize = 10f * resources.displayMetrics.scaledDensity
        isFakeBoldText = true
    }

    private fun compactCost(total: Double): String {
        if (total <= 0) return ""
        if (total >= 10000) {
            val wan = total / 10000.0
            return if (wan >= 10) "${wan.toInt()}万" else "${"%.1f".format(wan).trimEnd('0').trimEnd('.')}万"
        }
        return total.toInt().toString()
    }
    private val axisPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = line
        strokeWidth = resources.displayMetrics.density
    }
    private val wickPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        strokeWidth = 1.5f * resources.displayMetrics.density
        strokeCap = Paint.Cap.ROUND
    }

    fun submit(data: List<CostBucket>, selected: String, nextKind: CostChartKind = CostChartKind.BAR) {
        bars.clear()
        bars.addAll(data)
        selectedKey = selected
        kind = nextKind
        requestLayout()
        invalidate()
    }

    override fun onMeasure(widthMeasureSpec: Int, heightMeasureSpec: Int) {
        val density = resources.displayMetrics.density
        val desired = when {
            kind == CostChartKind.CALENDAR && bars.size > 40 -> (520 * density).toInt()
            kind == CostChartKind.CALENDAR -> (360 * density).toInt()
            else -> (200 * density).toInt()
        }
        val width = MeasureSpec.getSize(widthMeasureSpec)
        setMeasuredDimension(width, desired)
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        hitRects.clear()
        if (bars.isEmpty()) return
        when (kind) {
            CostChartKind.BAR -> drawBars(canvas)
            CostChartKind.KLINE -> drawKline(canvas)
            CostChartKind.CALENDAR -> if (bars.size > 40) drawYearCalendar(canvas) else drawMonthCalendar(canvas)
        }
    }

    private fun drawBars(canvas: Canvas) {
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
            hitRects.add(rect to bar)
            fillPaint.color = pine
            fillPaint.alpha = when {
                bar.key == selectedKey -> 255
                bar.total > 0 -> 140
                else -> 40
            }
            canvas.drawRoundRect(rect, 3f * density, 3f * density, fillPaint)

            val showLabel = !dense || i == 0 || i == n - 1 || (i + 1) % 5 == 0 || bar.key == selectedKey
            if (showLabel) {
                val label = bar.label.removeSuffix("日").removeSuffix("月")
                canvas.drawText(label, (left + right) / 2f, height - 8f * density, labelPaint)
            }
            if (bar.key == selectedKey && bar.total > 0) {
                amountPaint.color = pine
                amountPaint.textSize = 10f * resources.displayMetrics.scaledDensity
                canvas.drawText(
                    bar.total.toInt().toString(),
                    (left + right) / 2f,
                    top - 4f * density,
                    amountPaint,
                )
            }
        }
    }

    private fun drawKline(canvas: Canvas) {
        val density = resources.displayMetrics.density
        val padL = 8f * density
        val padR = 8f * density
        val padT = 22f * density
        val padB = 26f * density
        val innerW = width - padL - padR
        val innerH = height - padT - padB
        if (innerW <= 0f || innerH <= 0f) return

        val n = bars.size
        val gap = minOf(6f * density, innerW / n * 0.2f)
        val slotW = max(3f, (innerW - gap * (n + 1)) / n)
        val maxVal = max(
            0.01,
            bars.maxOf { maxOf(it.high, it.total, it.open, it.close, it.low) },
        )
        val baseline = height - padB
        canvas.drawLine(padL, baseline, width - padR, baseline, axisPaint)
        fun yOf(value: Double) = baseline - (value / maxVal * innerH).toFloat()

        val dense = n > 16
        bars.forEachIndexed { i, bar ->
            val left = padL + gap + i * (slotW + gap)
            val right = left + slotW
            val cx = (left + right) / 2f
            hitRects.add(RectF(left, padT, right, baseline) to bar)
            val high = maxOf(bar.high, bar.total, bar.open, bar.close)
            val low = if (bar.low > 0) bar.low else minOf(bar.open, bar.close, bar.total).takeIf { it > 0 } ?: 0.0
            val open = if (bar.open > 0) bar.open else bar.total
            val close = if (bar.close > 0) bar.close else bar.total
            val up = close >= open
            val color = if (high <= 0) line else if (up) cinnabar else pine
            wickPaint.color = color
            fillPaint.color = color
            fillPaint.alpha = if (bar.key == selectedKey) 255 else 200
            if (high <= 0) {
                canvas.drawLine(left + 2f, baseline, right - 2f, baseline, axisPaint)
            } else {
                canvas.drawLine(cx, yOf(high), cx, yOf(low), wickPaint)
                val bodyW = max(3f * density, slotW * 0.55f)
                val yOpen = yOf(open)
                val yClose = yOf(close)
                val top = min(yOpen, yClose)
                val bodyH = max(2f * density, kotlin.math.abs(yClose - yOpen))
                canvas.drawRoundRect(
                    RectF(cx - bodyW / 2f, top, cx + bodyW / 2f, top + bodyH),
                    2f * density,
                    2f * density,
                    fillPaint,
                )
            }
            val showLabel = !dense || i == 0 || i == n - 1 || (i + 1) % 5 == 0 || bar.key == selectedKey
            if (showLabel) {
                val label = bar.label.removeSuffix("日").removeSuffix("月")
                canvas.drawText(label, cx, height - 8f * density, labelPaint)
            }
        }
    }

    private fun drawMonthCalendar(canvas: Canvas) {
        val density = resources.displayMetrics.density
        val pad = 10f * density
        val headerH = 22f * density
        val weekdays = arrayOf("日", "一", "二", "三", "四", "五", "六")
        val gridTop = pad + headerH
        val cellW = (width - pad * 2) / 7f
        val cellH = (height - gridTop - pad) / 6f
        weekdays.forEachIndexed { i, name ->
            canvas.drawText(name, pad + cellW * i + cellW / 2f, pad + 14f * density, labelPaint)
        }
        val first = bars.firstOrNull()?.key?.split("-") ?: return
        if (first.size < 3) return
        val cal = Calendar.getInstance()
        cal.set(first[0].toInt(), first[1].toInt() - 1, 1)
        val offset = cal.get(Calendar.DAY_OF_WEEK) - 1
        bars.forEachIndexed { i, bar ->
            val slot = offset + i
            val col = slot % 7
            val row = slot / 7
            val left = pad + col * cellW
            val top = gridTop + row * cellH
            val rect = RectF(left + 2f * density, top + 2f * density, left + cellW - 2f * density, top + cellH - 2f * density)
            hitRects.add(rect to bar)
            drawCalCell(canvas, rect, bar, density, compact = false)
        }
    }

    private fun drawYearCalendar(canvas: Canvas) {
        val density = resources.displayMetrics.density
        val pad = 8f * density
        val gap = 8f * density
        val cols = 3
        val rows = 4
        val monthW = (width - pad * 2 - gap * (cols - 1)) / cols
        val monthH = (height - pad * 2 - gap * (rows - 1)) / rows
        val byMonth = bars.groupBy { it.key.take(7) }
        for (mon in 1..12) {
            val col = (mon - 1) % cols
            val row = (mon - 1) / cols
            val left = pad + col * (monthW + gap)
            val top = pad + row * (monthH + gap)
            val key = bars.firstOrNull()?.key?.take(4)?.let { "$it-%02d".format(mon) } ?: continue
            labelPaint.textAlign = Paint.Align.LEFT
            canvas.drawText("${mon}月", left + 2f * density, top + 11f * density, labelPaint)
            labelPaint.textAlign = Paint.Align.CENTER
            val days = byMonth[key].orEmpty()
            if (days.isEmpty()) continue
            val parts = days.first().key.split("-")
            val cal = Calendar.getInstance()
            cal.set(parts[0].toInt(), mon - 1, 1)
            val offset = cal.get(Calendar.DAY_OF_WEEK) - 1
            val gridTop = top + 16f * density
            val cellW = monthW / 7f
            val cellH = (monthH - 18f * density) / 6f
            days.forEachIndexed { i, bar ->
                val slot = offset + i
                val c = slot % 7
                val r = slot / 7
                val cell = RectF(
                    left + c * cellW + 1f,
                    gridTop + r * cellH + 1f,
                    left + (c + 1) * cellW - 1f,
                    gridTop + (r + 1) * cellH - 1f,
                )
                hitRects.add(cell to bar)
                drawCalCell(canvas, cell, bar, density, compact = true)
            }
        }
    }

    private fun drawCalCell(
        canvas: Canvas,
        rect: RectF,
        bar: CostBucket,
        density: Float,
        compact: Boolean,
    ) {
        val selected = bar.key == selectedKey || (selectedKey.length == 7 && bar.key.startsWith(selectedKey))
        fillPaint.color = Color.WHITE
        fillPaint.alpha = 255
        canvas.drawRoundRect(rect, 3f * density, 3f * density, fillPaint)
        strokePaint.color = line
        strokePaint.strokeWidth = density
        canvas.drawRoundRect(rect, 3f * density, 3f * density, strokePaint)
        if (selected) {
            strokePaint.color = gold
            strokePaint.strokeWidth = 1.6f * density
            canvas.drawRoundRect(rect, 3f * density, 3f * density, strokePaint)
        }
        val day = bar.key.takeLast(2).trimStart('0').ifBlank { bar.key.takeLast(2) }
        val amount = compactCost(bar.total)
        amountPaint.color = cinnabar
        amountPaint.textSize = (if (compact) 7f else 10f) * resources.displayMetrics.scaledDensity
        labelPaint.color = ink
        labelPaint.textSize = (if (compact) 8f else 11f) * resources.displayMetrics.scaledDensity
        labelPaint.textAlign = Paint.Align.CENTER
        val cx = rect.centerX()
        if (amount.isNotEmpty()) {
            canvas.drawText(amount, cx, rect.top + (if (compact) 9f else 13f) * density, amountPaint)
        }
        canvas.drawText(day, cx, rect.bottom - (if (compact) 3f else 6f) * density, labelPaint)
        labelPaint.color = inkSoft
        labelPaint.textSize = 11f * resources.displayMetrics.scaledDensity
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_DOWN) return true
        if (event.action != MotionEvent.ACTION_UP) return super.onTouchEvent(event)
        val x = event.x
        val y = event.y
        hitRects.forEach { (rect, bar) ->
            val hit = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom + 8f
            if (hit) {
                onBarClick?.invoke(bar)
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
