import React, { useState, useEffect } from "react";
import { Package } from "lucide-react";
import CalcShell from "@/components/CalcShell";
import MeasurementInput from "@/components/MeasurementInput";
import { ResultCard, FormulaBreakdown, WarningList } from "@/components/ResultCard";
import { calcMaterial, applyWaste, validateMeasurements, formatValue } from "@/lib/measurementUtils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import ObstacleToolkit from "@/components/ObstacleToolkit";
import { Switch } from "@/components/ui/switch";
import { squareSection, activeDeductionArea } from "@/lib/deductionUtils";

export default function MaterialCalc() {
  const [area, setArea] = useState(0);
  const [waste, setWaste] = useState(10);
  const [products, setProducts] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [product, setProduct] = useState(null);
  const [deductions, setDeductions] = useState([]);
  const [alreadyNet, setAlreadyNet] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.Product.list();
        setProducts(list);
      } catch (e) {
        // no products yet
      }
    })();
  }, []);

  const onSelect = async (id) => {
    setSelectedId(id);
    if (!id) { setProduct(null); return; }
    const found = products.find((p) => p.id === id);
    setProduct(found || null);
  };

  const activeDeduct = alreadyNet ? 0 : activeDeductionArea(deductions);
  const netArea = Math.max(0, area - activeDeduct);
  const wasteResult = applyWaste(netArea, waste);
  const material = product ? calcMaterial(wasteResult.total, product) : null;
  const warnings = validateMeasurements({ wastePercent: waste }, "material");
  if (alreadyNet && deductions.length > 0) warnings.push("This imported quantity already includes deductions — obstacle subtraction is off.");

  return (
    <CalcShell title="Material Quantity" subtitle="Pieces, pallets & estimated cost" icon={Package}>
      <div className="space-y-4">
        <MeasurementInput label="Total Area" onChange={setArea} />

        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <div>
            <div className="text-sm font-semibold text-amber-800">Imported area already includes deductions</div>
            <div className="text-xs text-amber-700">Turn on if this net area came from another calculator.</div>
          </div>
          <Switch checked={alreadyNet} onCheckedChange={setAlreadyNet} />
        </div>

        <div>
          <Label className="text-base font-semibold">Select Product</Label>
          <select
            value={selectedId}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full h-12 text-base mt-1 rounded-md border border-slate-200 bg-white px-3"
          >
            <option value="">— Choose a saved product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_name} {p.color ? `(${p.color})` : ""}
              </option>
            ))}
          </select>
          {products.length === 0 && (
            <p className="text-xs text-slate-400 mt-1">No products saved yet. Add products in the Product Library.</p>
          )}
        </div>

        <div>
          <Label className="text-base font-semibold">Waste %</Label>
          <div className="flex gap-2 mt-1">
            {[5, 7, 10, 12, 15].map((w) => (
              <button
                key={w}
                onClick={() => setWaste(w)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold ${waste === w ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-600"}`}
              >
                {w}%
              </button>
            ))}
          </div>
        </div>

        <WarningList warnings={warnings} />

        {product ? (
          <>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="font-bold text-slate-800">{product.product_name}</div>
              <div className="text-sm text-slate-500">
                {product.length_in} × {product.width_in} in
                {product.sqft_per_pallet ? ` · ${product.sqft_per_pallet} sq ft/pallet` : ""}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <ResultCard title="Net Area (after deductions)" value={formatValue(netArea, "hundredth")} unit="sq ft"
                formula={alreadyNet ? "Imported net area — no deductions applied" : `${formatValue(area, "hundredth")} − ${formatValue(activeDeduct, "hundredth")} = ${formatValue(netArea, "hundredth")}`} />
              <ResultCard title="Area (with waste)" value={formatValue(wasteResult.total, "hundredth")} unit="sq ft" />
              <ResultCard title="Pieces Required" value={material.piecesRequired} unit="pieces"
                formula={`${formatValue(wasteResult.total, "hundredth")} ÷ ${formatValue(material.sqftPerPiece, "hundredth")} sq ft/piece → round up`} />
              {product.sqft_per_pallet > 0 && (
                <ResultCard title="Pallets Required" value={material.palletsRequired} unit="pallets"
                  formula={`${formatValue(wasteResult.total, "hundredth")} ÷ ${product.sqft_per_pallet} sq ft/pallet → round up`} />
              )}
              {material.estimatedCost > 0 && (
                <ResultCard title="Estimated Material Cost" value={`$${formatValue(material.estimatedCost, "hundredth")}`} unit="" />
              )}
            </div>

            <FormulaBreakdown
              steps={[
                `Area with waste = ${formatValue(wasteResult.total, "hundredth")} sq ft`,
                `Sq ft per piece = (${product.length_in} × ${product.width_in}) ÷ 144 = ${formatValue(material.sqftPerPiece, "hundredth")}`,
                `Pieces = ${formatValue(wasteResult.total, "hundredth")} ÷ ${formatValue(material.sqftPerPiece, "hundredth")} = ${material.piecesRequired} (rounded up)`,
                product.sqft_per_pallet > 0 ? `Pallets = ${formatValue(wasteResult.total, "hundredth")} ÷ ${product.sqft_per_pallet} = ${material.palletsRequired} (rounded up)` : "",
              ].filter(Boolean)}
            />
          </>
        ) : (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
            Select a product to calculate quantities.
          </div>
        )}
        <ObstacleToolkit
          grossArea={area}
          sections={[squareSection(area, "Material")]}
          deductions={deductions}
          setDeductions={setDeductions}
        />
      </div>
    </CalcShell>
  );
}