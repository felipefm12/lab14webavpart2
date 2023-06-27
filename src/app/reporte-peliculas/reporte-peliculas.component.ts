import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as XLSX from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';
import * as Papa from 'papaparse';


@Component({
  selector: 'app-reporte-peliculas',
  templateUrl: './reporte-peliculas.component.html',
  styleUrls: ['./reporte-peliculas.component.css'],
})
export class ReportePeliculasComponent implements OnInit {
  peliculas: any[] = [];
  peliculasFiltradas: any[] = [];
  filtroGenero: string = '';
  filtroLanzamiento: number | null = null;

  constructor(private http: HttpClient) {
    (<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
  }

  ngOnInit() {
    this.http.get<any[]>('./assets/peliculas.json').subscribe((data) => {
      this.peliculas = data;
      this.filtrarPeliculas();
    });
  }

  filtrarPeliculas() {
    this.peliculasFiltradas = this.peliculas.filter((pelicula) => {
      if (this.filtroGenero && pelicula.genero !== this.filtroGenero) {
        return false;
      }
      if (this.filtroLanzamiento && pelicula.lanzamiento !== this.filtroLanzamiento) {
        return false;
      }
      return true;
    });
  }

  generarPDF() {
    const contenido = [
      { text: 'Informe de Películas', style: 'header' },
      { text: '\n\n' },
      {
        table: {
          headerRows: 1,
          widths: ['*', '*', '*'],
          body: [
            ['Título', 'Género', 'Año de lanzamiento'],
            ...this.peliculasFiltradas.map((pelicula) => [
              pelicula.titulo,
              pelicula.genero,
              pelicula.lanzamiento.toString(),
            ]),
          ],
        },
      },
    ];
  
    const estilos = {
      header: {
        fontSize: 18,
        bold: true,
        alignment: 'center',
        margin: [0, 10, 0, 10],
      },
    };
  
    const documentDefinition: any = {
      content: contenido,
      styles: estilos,
    };
  
    pdfMake.createPdf(documentDefinition).open();
  }
  

  exportarExcel() {
    const data: any[][] = [
      ['Título', 'Género', 'Año de lanzamiento'],
      ...this.peliculasFiltradas.map((pelicula) => [
        pelicula.titulo,
        pelicula.genero,
        pelicula.lanzamiento.toString(),
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Informe de Películas');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    this.descargarArchivo(wbout, 'InformePeliculas.xlsx');
  }

  exportarCSV() {
    const csvData = Papa.unparse(this.peliculasFiltradas, {
      header: true,
    });

    this.descargarArchivo(csvData, 'InformePeliculas.csv');
  }

  descargarArchivo(data: any, filename: string) {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
