import React, { useEffect, useState } from "react";
// AA
import { useSmartAccountContext } from "../components/SmartAccountContext";
import addresses from "../contracts/addresses.json";
import ERC20_BASE_ABI from "../contracts/artifacts/ERC20_BASE.json";
import SmartBasketABI from "../contracts/artifacts/SmartBasket.json";
import {
  PORTFOLIO_PLANS,
  getRiskBorderClass,
  getRiskColorClass,
  getTokenRiskByAddress,
} from "../utils/scaffold-eth/riskUtils";
import { usePortfolioContext } from "./PortfolioContext";
import { parseEther } from "ethers";
import { encodeFunctionData } from "viem";
import { useReadContract } from "wagmi";

const MAXUINT256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;

const tokens = addresses.tokens;
const predefinedPlans = PORTFOLIO_PLANS;
const tokenOptions = Object.entries(tokens).map(([name, address]) => ({ name, address }));

function CreatePortfolio() {
  const { smartAccountAddress: userAddress, sendTransaction } = useSmartAccountContext();
  const { setRefreshPortfolios, setRefreshTokenBalances, portfolioDetails, setPortfolioDetails } =
    usePortfolioContext();

  const [allowance, setAllowance] = useState<bigint>(0n);
  const [basketAmount, setBasketAmount] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"custom" | number>("custom");
  const [customAllocations, setCustomAllocations] = useState<
    Array<{ tokenAddress: string; percentage: number; amount: number }>
  >([]);
  const [isApproving, setIsApproving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSuccess] = useState(false);
  const [txError, setTxError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const basketAddress = addresses.core.SmartPortfolio as `0x${string}`;
  const usdtAddress = addresses.tokens.USDT as `0x${string}`;

  // Check allowance
  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: usdtAddress,
    abi: ERC20_BASE_ABI.abi,
    functionName: "allowance",
    args: userAddress ? [userAddress, basketAddress] : undefined,
  });

  useEffect(() => {
    if (allowanceData !== undefined) {
      setAllowance(allowanceData as bigint);
    }
  }, [allowanceData]);

  // Reset error and success messages after delay
  useEffect(() => {
    if (txError || successMessage) {
      const timer = setTimeout(() => {
        setTxError("");
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [txError, successMessage]);

  // Approve tokens using AA
  const handleApprove = async () => {
    try {
      setIsApproving(true);

      const data = encodeFunctionData({
        abi: ERC20_BASE_ABI.abi,
        functionName: "approve",
        args: [basketAddress, MAXUINT256],
      });

      const hash = await sendTransaction({
        to: usdtAddress,
        data,
      });

      if (hash) {
        await refetchAllowance();
        setSuccessMessage("USDT Approval successful!");
      }
    } catch (error) {
      console.error("Error approving tokens:", error);
      setTxError((error as string) || "Failed to approve USDT");
    } finally {
      setIsApproving(false);
    }
  };

  // Create Basket using AA
  const handleCreateBasket = async () => {
    try {
      setIsCreating(true);
      const allocations = getAllocations();
      console.log("Allocations:", allocations);

      const data = encodeFunctionData({
        abi: SmartBasketABI.abi,
        functionName: "createBasket",
        args: [allocations, parseEther(basketAmount)],
      });

      const hash = await sendTransaction({
        to: basketAddress,
        data,
      });

      if (hash) {
        // Update global portfolio state
        const newPortfolio = {
          tokenAddresses: allocations.map(a => a.tokenAddress),
          tokenPercentages: allocations.map(a => a.percentage),
          tokenAmounts: allocations.map(() => BigInt(0)), // Will be updated on refresh
          tokenValues: allocations.map(() => BigInt(0)), // Will be updated on refresh
          investmentValue: parseEther(basketAmount),
          totalValue: parseEther(basketAmount), // Initial value equals investment
        };

        setPortfolioDetails([...portfolioDetails, newPortfolio]);
        setRefreshPortfolios(true);
        setRefreshTokenBalances(true);

        setSuccessMessage(`Portfolio created successfully! Investment: ${basketAmount} USDT`);

        // Reset form
        setBasketAmount("");
        setSelectedPlan("custom");
        setCustomAllocations([]);
      }
    } catch (error) {
      console.error("Error creating basket:", error);
      setTxError((error as string) || "Failed to create portfolio");
    } finally {
      setIsCreating(false);
    }
  };

  const handlePlanChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedPlan(value === "custom" ? "custom" : parseInt(value));
  };

  const handleCustomAllocationChange = (index: number, field: "tokenAddress" | "percentage", value: string) => {
    const newAllocations = [...customAllocations];
    if (field === "tokenAddress") {
      newAllocations[index].tokenAddress = value;
    } else {
      newAllocations[index].percentage = parseInt(value) || 0;
    }
    setCustomAllocations(newAllocations);
  };

  const addCustomAllocation = () => {
    if (customAllocations.length < 5) {
      setCustomAllocations([...customAllocations, { tokenAddress: "", percentage: 0, amount: 0 }]);
    }
  };

  const removeCustomAllocation = (index: number) => {
    setCustomAllocations(customAllocations.filter((_, i) => i !== index));
  };

  const getAllocations = () => {
    if (selectedPlan === "custom") {
      return customAllocations.map(({ tokenAddress, percentage }) => ({ tokenAddress, percentage, amount: 0 }));
    }
    return predefinedPlans[selectedPlan].allocations;
  };

  const isCustomPlanValid =
    customAllocations.length > 0 &&
    customAllocations.every(allocation => allocation.tokenAddress && allocation.percentage > 0) &&
    customAllocations.reduce((sum, allocation) => sum + allocation.percentage, 0) === 100;

  const isPlanValid = selectedPlan === "custom" ? isCustomPlanValid : true;

  return (
    <div className="my-2 p-4 bg-base-200 rounded-lg">
      <h3 className="text-xl font-bold mb-4">Create Smart Portfolio</h3>

      {allowance === 0n ? (
        <div>
          <p className="mb-2">You need to approve the Smart Basket contract to use your USDT.</p>
          <button onClick={handleApprove} disabled={isApproving} className="btn btn-primary w-full">
            {isApproving ? "Approving..." : "Approve USDT"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="label">
              <span className="label-text">
                Select Investment Plan <br /> OR Create your own portfolio
              </span>
            </label>
            <select
              className={`select select-bordered w-full ${
                selectedPlan !== "custom" ? getRiskBorderClass(predefinedPlans[selectedPlan].name) : ""
              }`}
              value={selectedPlan === "custom" ? "custom" : selectedPlan}
              onChange={handlePlanChange}
            >
              <option value="custom">Custom Plan</option>
              {predefinedPlans.map((plan, index) => (
                <option key={index} value={index}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>

          {selectedPlan !== "custom" && (
            <div className={`p-4 rounded-lg ${getRiskColorClass(predefinedPlans[selectedPlan].name)}`}>
              <h4 className="font-bold mb-2">{predefinedPlans[selectedPlan].name} Plan Details:</h4>
              <p className="text-sm mb-2">{predefinedPlans[selectedPlan].description}</p>
              <ul className="list-disc list-inside">
                {predefinedPlans[selectedPlan].allocations.map((allocation, index) => {
                  return (
                    <li key={index}>
                      {allocation.symbol}: {allocation.percentage}%
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {selectedPlan === "custom" && (
            <div className="space-y-2">
              {customAllocations.map((allocation, index) => (
                <div key={index} className={`flex items-center space-x-2`}>
                  <div
                    className={`border-full p-2 w-2 ${
                      getTokenRiskByAddress(allocation.tokenAddress)
                        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                          getRiskColorClass(getTokenRiskByAddress(allocation.tokenAddress)!.riskLevel)
                        : ""
                    }`}
                  ></div>
                  <select
                    className="select select-bordered flex-grow"
                    value={allocation.tokenAddress}
                    onChange={e => handleCustomAllocationChange(index, "tokenAddress", e.target.value)}
                  >
                    <option value="">Select Token</option>
                    {tokenOptions.map(token => (
                      <option key={token.address} value={token.address}>
                        {token.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className="input input-bordered w-24"
                    value={allocation.percentage}
                    onChange={e => handleCustomAllocationChange(index, "percentage", e.target.value)}
                    placeholder="%"
                  />
                  <span className="p-2">%</span>
                  <button
                    className="btn btn-square btn-outline btn-sm text-center"
                    onClick={() => removeCustomAllocation(index)}
                  >
                    X
                  </button>
                </div>
              ))}
              {customAllocations.length < 5 && (
                <button className="btn btn-secondary w-full" onClick={addCustomAllocation}>
                  Add Token
                </button>
              )}
              {selectedPlan === "custom" && !isCustomPlanValid && customAllocations.length > 0 && (
                <p className="text-warning text-sm text-center">
                  Please ensure all tokens are selected, percentages are greater than 0, and the total percentage is
                  100%.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="label">
              <span className="label-text">Amount in USDT</span>
            </label>
            <input
              type="text"
              value={basketAmount}
              onChange={e => setBasketAmount(e.target.value)}
              placeholder="Amount in USDT"
              className="input input-bordered w-full"
            />
          </div>

          <button
            onClick={handleCreateBasket}
            disabled={isCreating || !basketAmount || !isPlanValid}
            className="btn btn-primary w-full"
          >
            {isCreating ? "Creating Basket..." : "Create Basket"}
          </button>
        </div>
      )}

      {isSuccess && (
        <div className="mt-4 p-4 bg-success text-success-content rounded-lg">Basket created successfully!</div>
      )}
    </div>
  );
}

export default CreatePortfolio;
