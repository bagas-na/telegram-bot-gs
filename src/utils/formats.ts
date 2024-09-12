import { CustomerCategory, CustomerData } from "../types";

export function formatCustomerData(customerData: CustomerData): string {
  let formatText;
  formatText = "------\n";
  formatText += "Kategori: " + customerData.customer_category + "\n";
  formatText += "Nama GC: " + customerData.customer_name + "\n";
  formatText += "Submit Proposal (sudah/belum): " + customerData.submit_proposal ? "sudah" : "belum" + "\n";
  formatText += "Connectivity: " + customerData.connectivity + "\n";
  formatText += "Antares Eazy: " + customerData.eazy + "\n";
  formatText += "OCA: " + customerData.oca + "\n";
  formatText += "Digiclinic: " + customerData.digiclinic + "\n";
  formatText += "Pijar: " + customerData.pijar + "\n";
  formatText += "Sprinthink: " + customerData.sprinthink + "\n";
  formatText += "Nilai Project (Rp): " + customerData.nilai_project + "\n";
  formatText += "------\n";

  return formatText;
}

export function formatPropertySelectionMenu(customerCategory: CustomerCategory): string {
  let formatText;
  formatText = "**Silahkan pilih informasi GC yang ingin di diubah**\n";
  formatText += "Langsung klik saja pada tombol yang muncul di bawah!\n\n";
  formatText += "**submit_proposal**, apakah proposal masif telah dikirimkan.\n\n";
  formatText += "**connectivity**, status funneling layanan Datin/WMS/Indibiz/etc.\n\n";
  formatText += "**eazy**, status funneling Antares Eazy.\n\n";
  formatText += "**oca**, status funneling OCA.\n\n";
  formatText += "**digiclinic**, status funenling Digiclinic.\n\n";
  formatText += "**pijar**, status funneling ekosistem Pijar.\n\n";
  formatText += "**sprinthink**, status funneling Sprinthink.\n\n";
  formatText += "**nilai_project**, estimasi nilai project.\n\n";
  formatText += "**CANCEL**, kembali ke daftar pelanggan untuk kategori " + customerCategory + ".";

  return formatText;
}
