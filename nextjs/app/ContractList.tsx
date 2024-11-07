import React from "react";
import { Address } from "~~/components/scaffold-eth";

interface AddressesType {
  [key: string]: string;
}

interface ContractListProps {
  addresses: AddressesType;
}

const ContractList: React.FC<ContractListProps> = ({ addresses }) => {
  return (
    <div className="mt-8 p-4 bg-base-200 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Deployed Contracts</h2>
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Contract Name</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(addresses).map(([name, address]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>
                  <Address address={address} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContractList;
